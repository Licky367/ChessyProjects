const financialService = require("../services/financialsServices");


/* =========================
   DAILY FINANCIALS
========================= */
exports.getDailyFinancials = async (req, res) => {
  try {
    const { day } = req.query;

    const result = await financialService.computeDailyFinancials(day);

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* =========================
   MONTHLY FINANCIALS
========================= */
exports.getMonthlyFinancials = async (req, res) => {
  try {
    const { month } = req.query;

    const result = await financialService.computeMonthlyFinancials(month);

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* =========================
   YEARLY FINANCIALS
========================= */
exports.getYearlyFinancials = async (req, res) => {
  try {
    const { year } = req.query;

    const result = await financialService.computeYearlyFinancials(Number(year));

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* =========================
   FETCH STORED FINANCIALS
========================= */
exports.getFinancialRecord = async (req, res) => {
  try {
    const { day, month, year, type } = req.query;

    const result = await financialService.getFinancials({
      day,
      month,
      year: Number(year),
      type
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};