const nursingService = require("../services/nursingService");

exports.renderNursingList = async (req, res) => {
  const batches = await nursingService.getActiveBatches();

  res.render("nursing/list", { batches });
};

exports.createPurchase = async (req, res) => {
  try {
    await nursingService.createFromPurchase(req.body);
    res.redirect("/nursing");
  } catch (err) {
    res.send(err.message);
  }
};

exports.renderBatchDetails = async (req, res) => {
  const batch = await nursingService.getBatchById(req.params.id);

  res.render("nursing/details", { batch, user: req.user });
};

exports.recordDeath = async (req, res) => {
  try {
    const { count, cause } = req.body;

    await nursingService.recordDeath({
      batchId: req.params.id,
      count,
      cause,
      user: req.user
    });

    res.redirect(`/nursing/${req.params.id}`);
  } catch (err) {
    res.send(err.message);
  }
};

exports.sellPoultry = async (req, res) => {
  try {
    const { count, amount } = req.body;

    await nursingService.sellPoultry({
      batchId: req.params.id,
      count,
      amount,
      user: req.user
    });

    res.redirect(`/nursing/${req.params.id}`);
  } catch (err) {
    res.send(err.message);
  }
};

exports.cageBatch = async (req, res) => {
  try {
    const { perCage } = req.body;

    await nursingService.cageBatch({
      batchId: req.params.id,
      perCage
    });

    res.redirect("/nursing");
  } catch (err) {
    res.send(err.message);
  }
};