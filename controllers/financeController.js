const financeService = require("../services/financeService");

exports.renderFinancePage = async (req, res) => {
  const stats = await financeService.getLifetimeStats();
  const records = await financeService.getMonthlyStats(
    new Date().getFullYear(),
    new Date().getMonth()
  );

  res.render("finance/index", { stats, records });
};

exports.addInvestment = async (req, res) => {
  try {
    const { amount, description } = req.body;

    await financeService.recordInvestment({
      amount,
      description,
      userId: req.user._id
    });

    res.redirect("/finance");
  } catch (err) {
    res.send(err.message);
  }
};