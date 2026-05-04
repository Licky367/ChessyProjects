const PoultryFinance = require("../models/PoultryFinance");

const VALID_POULTRY_TYPES = [
  "chicken",
  "duck",
  "turkey",
  "goose",
  "quail",
  "other"
];

// =========================
// RECORD INVESTMENT
// =========================
exports.recordInvestment = async ({ amount, poultryType, description, userId }) => {
  if (!VALID_POULTRY_TYPES.includes(poultryType)) {
    throw new Error("Invalid poultry type");
  }

  amount = Number(amount);
  if (amount < 0) throw new Error("Invalid amount");

  return await PoultryFinance.create({
    category: "investment",
    poultryType,
    amount,
    description,
    recordedBy: userId
  });
};

// =========================
// RECORD POULTRY SALE
// =========================
exports.recordPoultrySale = async ({ amount, quantity, poultryType, batchId, userId }) => {
  if (!VALID_POULTRY_TYPES.includes(poultryType)) {
    throw new Error("Invalid poultry type");
  }

  amount = Number(amount);
  quantity = Number(quantity);

  if (amount < 0) throw new Error("Invalid amount");
  if (!quantity || quantity <= 0) throw new Error("Invalid quantity");

  return await PoultryFinance.create({
    category: "poultry_sale",
    poultryType,
    amount,
    quantity,
    relatedBatch: batchId || null,
    recordedBy: userId
  });
};

// =========================
// RECORD EGG SALE
// =========================
exports.recordEggSale = async ({ amount, quantity, poultryType, userId }) => {
  if (!VALID_POULTRY_TYPES.includes(poultryType)) {
    throw new Error("Invalid poultry type");
  }

  amount = Number(amount);
  quantity = Number(quantity);

  if (amount < 0) throw new Error("Invalid amount");
  if (!quantity || quantity <= 0) throw new Error("Invalid quantity");

  return await PoultryFinance.create({
    category: "egg_sale",
    poultryType,
    amount,
    quantity,
    recordedBy: userId
  });
};

// =========================
// GET LIFETIME STATS (ALL TYPES COMBINED)
// =========================
exports.getLifetimeStats = async () => {
  const data = await PoultryFinance.aggregate([
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" }
      }
    }
  ]);

  let investment = 0,
    poultry = 0,
    eggs = 0;

  data.forEach((d) => {
    if (d._id === "investment") investment = d.total;
    if (d._id === "poultry_sale") poultry = d.total;
    if (d._id === "egg_sale") eggs = d.total;
  });

  const revenue = poultry + eggs;
  const profit = revenue - investment;

  return { investment, poultry, eggs, revenue, profit };
};

// =========================
// GET MONTHLY STATS (RAW RECORDS)
// =========================
exports.getMonthlyStats = async (year, month) => {
  const start = new Date(year, month, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, month + 1, 0);
  end.setHours(23, 59, 59, 999);

  return await PoultryFinance.find({
    createdAt: { $gte: start, $lte: end }
  });
};