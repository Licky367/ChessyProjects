const service = require("../services/poultryStatsService");

exports.renderStats = async (req, res) => {
  try {
    const { date, type } = req.query;

    const data = await service.getStats({
      date,
      type: type || "eggs"
    });

    res.render("poultryStats", {
      rows: data.rows || [],
      grandTotal: data.grandTotal || { day: 0, month: 0, year: 0 },
      selectedDate: date || "",
      selectedType: type || "eggs"
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
};