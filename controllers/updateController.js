const updateService = require('../services/updateService');


/* =========================================================
   🟩 VIEW DAIRY PROJECTS
========================================================= */
exports.viewDairyProjects = async (req, res) => {
  try {
    const dairies = await updateService.getPositiveDairies();

    res.render('dairyProjects', {
      title: 'Dairy Projects',
      dairies,
      user: req.session.user || null
    });

  } catch (err) {
    console.error('VIEW DAIRY PROJECTS ERROR:', err.message);
    res.status(500).send('Failed to load dairy projects');
  }
};


/* =========================================================
   🟦 VIEW STRUCTURES
========================================================= */
exports.viewStructures = async (req, res) => {
  try {
    const dairies = await updateService.getNegativeDairies();

    res.render('structures', {
      title: 'Structures',
      dairies,
      user: req.session.user || null
    });

  } catch (err) {
    console.error('VIEW STRUCTURES ERROR:', err.message);
    res.status(500).send('Failed to load structures');
  }
};


/* =========================================================
   🟨 VIEW PROFILE PAGE (FEED + POSTS + WEEKLY)
========================================================= */
exports.viewPage = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await updateService.getDairyPage(id);

    res.render('update', {
      title: 'Dairy Profile',

      dairy: data.dairy,
      updates: data.updates,
      posts: data.posts || [],
      weeklyFeed: data.weeklyFeed || null,

      commentCount: data.commentCount,
      user: req.session.user || null
    });

  } catch (err) {
    console.error('VIEW PAGE ERROR:', err.message);
    res.status(500).send('Failed to load dairy profile');
  }
};


/* =========================================================
   🟩 GENERAL COMMENT
========================================================= */
exports.comment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    const comment = req.body.comment?.trim();

    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!comment) return res.status(400).json({ error: 'Comment cannot be empty' });

    const saved = await updateService.addComment({
      dairyId: id,
      userId: user._id,
      comment
    });

    const payload = {
      _id: saved._id,
      comment: saved.comment,
      userName: user.name,
      userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      dateText: new Date(saved.createdAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('commentAdded', payload);

    return req.xhr || req.headers.accept?.includes('json')
      ? res.json(payload)
      : res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('COMMENT ERROR:', err.message);
    res.status(500).json({ error: 'Failed to post comment' });
  }
};


/* =========================================================
   🟦 UPDATE IMAGE
========================================================= */
exports.image = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');
    if (!req.file) return res.status(400).send('No image uploaded');

    await updateService.updateImage({
      dairyId: id,
      userId: user._id,
      image: req.file.filename
    });

    const payload = {
      dairyId: id,
      image: `/uploads/${req.file.filename}`,
      userName: user.name,
      dateText: new Date().toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('imageUpdated', payload);

    res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('IMAGE UPDATE ERROR:', err.message);
    res.status(500).send('Failed to update image');
  }
};


/* =========================================================
   🟥 MARK MEDICAL ATTENTION
========================================================= */
exports.markMedicalAttention = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');
    if (user.role !== 'dairyWorker') {
      return res.status(403).send('Only dairy workers can mark medical attention');
    }

    const { type, details } = req.body;

    if (!type?.trim() || !details?.trim()) {
      return res.status(400).send('Medical type and details are required');
    }

    const updated = await updateService.markMedicalAttention({
      dairyId: id,
      userId: user._id,
      type: type.trim(),
      details: details.trim()
    });

    const payload = {
      dairyId: id,
      type: updated.medicalAttention.type,
      details: updated.medicalAttention.details,
      userName: user.name,
      userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      dateText: new Date(updated.medicalAttention.markedAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('medicalMarked', payload);

    res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('MEDICAL MARK ERROR:', err.message);
    res.status(500).send('Failed to mark medical attention');
  }
};


/* =========================================================
   🟪 UNMARK MEDICAL ATTENTION
========================================================= */
exports.unmarkMedicalAttention = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');
    if (user.role !== 'admin') {
      return res.status(403).send('Only admin can unmark medical attention');
    }

    await updateService.unmarkMedicalAttention({ dairyId: id });

    const payload = {
      dairyId: id,
      cleared: true,
      userName: user.name,
      dateText: new Date().toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('medicalUnmarked', payload);

    res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('MEDICAL UNMARK ERROR:', err.message);
    res.status(500).send('Failed to unmark medical attention');
  }
};


/* =========================================================
   🟩 MARK MAINTENANCE (NEW)
========================================================= */
exports.markMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');

    if (!(user.role === 'admin' || user.role === 'dairyWorker')) {
      return res.status(403).send('Not allowed to mark maintenance');
    }

    const type = req.body.type?.trim();
    const description = req.body.description?.trim();

    if (!type || !description) {
      return res.status(400).send('Type and description are required');
    }

    const update = await updateService.markMaintenance({
      dairyId: id,
      userId: user._id,
      type,
      description
    });

    const payload = {
      dairyId: id,
      status: 'marked',
      type,
      description,
      userName: user.name,
      userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      dateText: new Date(update.createdAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('maintenanceMarked', payload);

    res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('MARK MAINTENANCE ERROR:', err.message);
    res.status(500).send('Failed to mark maintenance');
  }
};


/* =========================================================
   🟦 CLEAR MAINTENANCE (NEW)
========================================================= */
exports.clearMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');
    if (user.role !== 'admin') {
      return res.status(403).send('Only admin can clear maintenance');
    }

    const charges = Number(req.body.charges);
    const description = req.body.description?.trim();

    if (isNaN(charges) || charges < 0) {
      return res.status(400).send('Valid charges required');
    }

    if (!description) {
      return res.status(400).send('Description required');
    }

    const update = await updateService.clearMaintenance({
      dairyId: id,
      userId: user._id,
      charges,
      description
    });

    const payload = {
      dairyId: id,
      status: 'cleared',
      charges,
      description,
      userName: user.name,
      dateText: new Date(update.createdAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('maintenanceCleared', payload);

    res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('CLEAR MAINTENANCE ERROR:', err.message);
    res.status(500).send('Failed to clear maintenance');
  }
};


/* =========================================================
   🟦 POSTS SYSTEM
========================================================= */

exports.createPost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');

    const text = req.body.text?.trim();
    const image = req.file ? req.file.filename : null;

    if (!text && !image) {
      return res.status(400).send('Post cannot be empty');
    }

    const post = await updateService.createPost({
      dairyId: id,
      userId: user._id,
      userName: user.name,
      text,
      image
    });

    const payload = {
      _id: post._id,
      dairyId: id,
      userId: user._id,
      userName: user.name,
      userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      text,
      image,
      likes: 0,
      comments: [],
      createdAt: post.createdAt,
      dateText: new Date(post.createdAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('postCreated', payload);

    res.json(payload);

  } catch (err) {
    console.error('CREATE POST ERROR:', err.message);
    res.status(500).send('Failed to create post');
  }
};


exports.likePost = async (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;

    if (!user) return res.status(401).send('Unauthorized');

    const result = await updateService.toggleLike({
      postId: id,
      userId: user._id
    });

    const io = req.app.get('io');
    io.emit('postLiked', {
      postId: id,
      likes: result.likes
    });

    res.json(result);

  } catch (err) {
    console.error('LIKE ERROR:', err.message);
    res.status(500).send('Failed to like post');
  }
};


exports.addPostComment = async (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;

    if (!user) return res.status(401).send('Unauthorized');

    const text = req.body.text?.trim();
    if (!text) return res.status(400).send('Comment empty');

    const comment = await updateService.addPostComment({
      postId: id,
      userId: user._id,
      userName: user.name,
      text
    });

    const payload = {
      postId: id,
      comment: {
        ...comment,
        userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
      }
    };

    const io = req.app.get('io');
    if (io) io.emit('postCommentAdded', payload);

    res.json(comment);

  } catch (err) {
    console.error('POST COMMENT ERROR:', err.message);
    res.status(500).send('Failed to comment');
  }
};


exports.deletePost = async (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;

    if (!user) return res.status(401).send('Unauthorized');

    const deleted = await updateService.deletePost({
      postId: id,
      user
    });

    if (!deleted) return res.status(403).send('Not allowed');

    const io = req.app.get('io');
    io.emit('postDeleted', { postId: id });

    res.json({ success: true });

  } catch (err) {
    console.error('DELETE POST ERROR:', err.message);
    res.status(500).send('Failed to delete post');
  }
};


exports.deleteComment = async (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;

    if (!user) return res.status(401).send('Unauthorized');

    const deleted = await updateService.deleteComment({
      commentId: id,
      user
    });

    if (!deleted) return res.status(403).send('Not allowed');

    const io = req.app.get('io');
    io.emit('commentDeleted', { commentId: id });

    res.json({ success: true });

  } catch (err) {
    console.error('DELETE COMMENT ERROR:', err.message);
    res.status(500).send('Failed to delete comment');
  }
};