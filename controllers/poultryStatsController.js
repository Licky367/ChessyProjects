const service = require("../services/poultryStatsService");

exports.renderStatsPage = async (req, res) => {
  const date = req.query.date || new Date();
  const mode = req.query.mode || "eggs"; // eggs | sales

  let data;

  if (mode === "sales") {
    data = await service.getEggSalesStats(date);
  } else {
    data = await service.getEggCollectionStats(date);
  }

  res.render("poultryStats", {
    data,
    date,
    mode
  });
};