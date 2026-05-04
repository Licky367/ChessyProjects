const financeService = require("../services/financeService");

exports.renderFinancePage = async (req, res) => {
  try {
    const stats = await financeService.getLifetimeStats();

    const records = await financeService.getMonthlyStats(
      new Date().getFullYear(),
      new Date().getMonth()
    );

    res.render("finance/index", { stats, records });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.addInvestment = async (req, res) => {
  try {
    const { amount, poultryType, description } = req.body;

    await financeService.recordInvestment({
      amount,
      poultryType,
      description,
      userId: req.user._id
    });

    res.redirect("/finance");
  } catch (err) {
    res.status(400).send(err.message);
  }
};