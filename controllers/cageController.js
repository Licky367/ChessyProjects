const cageService = require("../services/cageService");

exports.renderCageList = async (req, res) => {
  const cages = await cageService.getCages();

  res.render("cage/list", { cages });
};

exports.renderCageDetails = async (req, res) => {
  const cage = await cageService.getCageById(req.params.id);

  res.render("cage/details", { cage });
};

exports.collectEggs = async (req, res) => {
  try {
    const { eggs } = req.body;

    await cageService.collectEggs({
      cageId: req.params.id,
      eggs
    });

    res.redirect(`/cage/${req.params.id}`);
  } catch (err) {
    res.send(err.message);
  }
};

exports.sellChicken = async (req, res) => {
  try {
    const { count, amount } = req.body;

    await cageService.sellChicken({
      cageId: req.params.id,
      count,
      amount,
      user: req.user
    });

    res.redirect("/cage");
  } catch (err) {
    res.send(err.message);
  }
};