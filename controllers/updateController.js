// controllers/updateController.js

const service = require('../services/updateService');

exports.viewPage = async (req, res) => {
  try {
    const data = await service.getDairyPage(req.params.id);

    res.render('update', {
      dairy: data.dairy,
      updates: data.updates,
      user: req.user
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.comment = async (req, res) => {
  try {
    await service.addComment({
      dairyId: req.params.id,
      userId: req.user._id,
      comment: req.body.comment
    });

    res.redirect(`/dairy/${req.params.id}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.image = async (req, res) => {
  try {
    await service.updateImage({
      dairyId: req.params.id,
      userId: req.user._id,
      image: req.file.filename
    });

    res.redirect(`/dairy/${req.params.id}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
};