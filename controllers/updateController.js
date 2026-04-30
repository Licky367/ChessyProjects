// controllers/updateController.js

const updateService = require('../services/updateService');

/**
 * VIEW DAIRY UPDATE PAGE
 */
exports.viewPage = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await updateService.getDairyPage(id);

    return res.render('update', {
      title: 'Dairy Profile',
      dairy: data.dairy,
      updates: data.updates,
      user: req.user || null
    });

  } catch (err) {
    console.error('VIEW PAGE ERROR:', err.message);
    return res.status(500).send('Failed to load dairy profile');
  }
};


/**
 * ADD COMMENT
 */
exports.comment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).send('Unauthorized');
    }

    const comment = req.body.comment?.trim();

    if (!comment) {
      return res.status(400).send('Comment cannot be empty');
    }

    await updateService.addComment({
      dairyId: id,
      userId: req.user._id,
      comment
    });

    return res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('COMMENT ERROR:', err.message);
    return res.status(500).send('Failed to post comment');
  }
};


/**
 * UPDATE IMAGE + CREATE UPDATE LOG
 */
exports.image = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).send('Unauthorized');
    }

    if (!req.file) {
      return res.status(400).send('No image uploaded');
    }

    await updateService.updateImage({
      dairyId: id,
      userId: req.user._id,
      image: req.file.filename
    });

    return res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('IMAGE UPDATE ERROR:', err.message);
    return res.status(500).send('Failed to update image');
  }
};