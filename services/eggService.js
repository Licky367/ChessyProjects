const EggStock = require("../models/EggStock");
const financeService = require("./financeService");

exports.getEggStock = async (type) => {
  return await EggStock.findOne({ poultryType: type });
};

exports.sellEggs = async ({ poultryType, quantity, amount, user }) => {
  const stock = await EggStock.findOne({ poultryType });

  if (!stock || stock.totalAvailable < quantity) {
    throw new Error("Not enough eggs");
  }

  stock.totalAvailable -= quantity;
  await stock.save();

  await financeService.recordEggSale({
    amount,
    quantity,
    userId: user._id
  });

  return stock;
};