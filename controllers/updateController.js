const updateService = require('../services/updateService');


/**
 * ===========================
 * VIEW DAIRY PROJECTS
 * ===========================
 */
exports.viewDairyProjects = async (req, res) => {
  try {
    const dairies = await updateService.getPositiveDairies();

    return res.render('dairyProjects', {
      title: 'Dairy Projects',
      dairies,
      user: req.session.user || null
    });

  } catch (err) {
    console.error('VIEW DAIRY PROJECTS ERROR:', err.message);
    return res.status(500).send('Failed to load dairy projects');
  }
};


/**
 * ===========================
 * VIEW STRUCTURES
 * ===========================
 */
exports.viewStructures = async (req, res) => {
  try {
    const dairies = await updateService.getNegativeDairies();

    return res.render('structures', {
      title: 'Structures',
      dairies,
      user: req.session.user || null
    });

  } catch (err) {
    console.error('VIEW STRUCTURES ERROR:', err.message);
    return res.status(500).send('Failed to load structures');
  }
};


/**
 * ===========================
 * VIEW PROFILE PAGE
 * ===========================
 */
exports.viewPage = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await updateService.getDairyPage(id);

    return res.render('update', {
      title: 'Dairy Profile',
      dairy: data.dairy,
      updates: data.updates,
      user: req.session.user || null
    });

  } catch (err) {
    console.error('VIEW PAGE ERROR:', err.message);
    return res.status(500).send('Failed to load dairy profile');
  }
};


/**
 * ===========================
 * ADD COMMENT
 * ===========================
 */
exports.comment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    const comment = req.body.comment?.trim();

    if (!user) return res.status(401).send('Unauthorized');
    if (!comment) return res.status(400).send('Comment cannot be empty');

    const saved = await updateService.addComment({
      dairyId: id,
      userId: user._id,
      comment
    });

    const io = req.app.get('io');

    if (io) {
      io.to(id).emit('commentAdded', {
        _id: saved._id,
        comment: saved.comment,
        userName: user.name,
        dateText: new Date(saved.createdAt).toLocaleString()
      });
    }

    return res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('COMMENT ERROR:', err.message);
    return res.status(500).send('Failed to post comment');
  }
};


/**
 * ===========================
 * UPDATE IMAGE
 * ===========================
 */
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

    const io = req.app.get('io');

    if (io) {
      io.to(id).emit('imageUpdated', {
        image: `/uploads/${req.file.filename}`
      });
    }

    return res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('IMAGE UPDATE ERROR:', err.message);
    return res.status(500).send('Failed to update image');
  }
};


/**
 * ===========================
 * MARK MEDICAL ATTENTION (dairyWorker only)
 * ===========================
 */
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

    // 🔥 UPDATE DB (CRITICAL FIX: ensure persistence)
    const updated = await updateService.markMedicalAttention({
      dairyId: id,
      userId: user._id,
      type: type.trim(),
      details: details.trim()
    });

    const io = req.app.get('io');

    if (io) {
      io.to(id).emit('medicalMarked', {
        dairyId: id,
        type: updated.medicalAttention.type,
        details: updated.medicalAttention.details,
        userName: user.name,
        dateText: new Date(updated.medicalAttention.markedAt).toLocaleString()
      });
    }

    return res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('MEDICAL MARK ERROR:', err.message);
    return res.status(500).send('Failed to mark medical attention');
  }
};


/**
 * ===========================
 * UNMARK MEDICAL ATTENTION (admin only)
 * ===========================
 */
exports.unmarkMedicalAttention = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');

    if (user.role !== 'admin') {
      return res.status(403).send('Only admin can unmark medical attention');
    }

    // 🔥 UPDATE DB (ENSURE CLEAN RESET)
    await updateService.unmarkMedicalAttention({
      dairyId: id
    });

    const io = req.app.get('io');

    if (io) {
      io.to(id).emit('medicalUnmarked', {
        dairyId: id,
        cleared: true,
        userName: user.name,
        dateText: new Date().toLocaleString()
      });
    }

    return res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('MEDICAL UNMARK ERROR:', err.message);
    return res.status(500).send('Failed to unmark medical attention');
  }
};