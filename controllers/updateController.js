const updateService = require('../services/updateService');

/**
 * ===========================
 * VIEW DAIRY PROJECTS (POSITIVE CODES ONLY)
 * renders: dairyProjects.ejs
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
 * VIEW STRUCTURES (NEGATIVE CODES ONLY)
 * renders: structures.ejs
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
 * VIEW DAIRY PROFILE PAGE
 * renders: update.ejs
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

    if (!comment) {
      return res.status(400).send('Comment cannot be empty');
    }

    const saved = await updateService.addComment({
      dairyId: id,
      userId: user._id,
      comment
    });

    /**
     * SOCKET EMISSION
     */
    const io = req.app.get('io');
    if (io) {
      io.to(id).emit('commentAdded', {
        _id: saved._id,
        comment: saved.comment,
        userName: user.name,
        dateText: saved.createdAt.toDateString()
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
 * UPDATE IMAGE + LOG UPDATE
 * ===========================
 */
exports.image = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!req.file) {
      return res.status(400).send('No image uploaded');
    }

    await updateService.updateImage({
      dairyId: id,
      userId: user._id,
      image: req.file.filename
    });

    /**
     * SOCKET EVENT
     */
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