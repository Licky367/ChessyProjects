const eggService = require("../services/eggService");

exports.renderEggPage = async (req, res) => {
  const { type } = req.query;

  const stock = await eggService.getEggStock(type || "chicken");

  res.render("egg/index", { stock, type });
};

exports.sellEggs = async (req, res) => {
  try {
    const { poultryType, quantity, amount } = req.body;

    await eggService.sellEggs({
      poultryType,
      quantity,
      amount,
      user: req.user
    });

    res.redirect("/eggs");
  } catch (err) {
    res.send(err.message);
  }
};