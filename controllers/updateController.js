const updateService = require('../services/updateService');

/**
 * VIEW DAIRY PROFILE PAGE
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
 * ADD COMMENT
 * (Socket-ready version)
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
     * SOCKET EMISSION (if enabled in app.js)
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
 * UPDATE IMAGE + LOG UPDATE
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
     * OPTIONAL SOCKET EVENT (future gallery sync)
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