const service = require("../services/poultryStatsService");

exports.renderStats = async (req, res) => {
  const { date, type } = req.query;

  const data = await service.getStats({
    date,
    type: type || "eggs"
  });

  res.render("poultryStats", {
    ...data,
    selectedDate: date,
    selectedType: type || "eggs"
  });
};