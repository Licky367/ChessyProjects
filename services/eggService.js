const EggStock = require("../models/EggStock");
const financeService = require("./financeService");

const VALID_POULTRY_TYPES = [
  "chicken",
  "duck",
  "turkey",
  "goose",
  "quail",
  "other"
];

// =========================
// GET EGG STOCK BY TYPE
// =========================
exports.getEggStock = async (type) => {
  if (!type) return null;

  if (!VALID_POULTRY_TYPES.includes(type)) {
    throw new Error("Invalid poultry type");
  }

  return await EggStock.findOne({ poultryType: type });
};

// =========================
// SELL EGGS
// =========================
exports.sellEggs = async ({ poultryType, quantity, amount, user }) => {
  if (!poultryType) {
    throw new Error("Poultry type is required");
  }

  if (!VALID_POULTRY_TYPES.includes(poultryType)) {
    throw new Error("Invalid poultry type");
  }

  quantity = Number(quantity);
  amount = Number(amount);

  if (!quantity || quantity <= 0) {
    throw new Error("Invalid egg quantity");
  }

  if (amount < 0) {
    throw new Error("Invalid amount");
  }

  const stock = await EggStock.findOne({ poultryType });

  if (!stock) {
    throw new Error("Egg stock not found for this poultry type");
  }

  if (stock.totalAvailable < quantity) {
    throw new Error("Not enough eggs available");
  }

  stock.totalAvailable -= quantity;
  await stock.save();

  await financeService.recordEggSale({
    amount,
    quantity,
    poultryType,
    userId: user._id
  });

  return stock;
};