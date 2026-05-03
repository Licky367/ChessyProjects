const PoultryFinance = require("../models/PoultryFinance");

exports.recordInvestment = async ({ amount, description, userId }) => {
  return await PoultryFinance.create({
    category: "investment",
    amount,
    description,
    recordedBy: userId
  });
};

exports.recordPoultrySale = async ({ amount, quantity, batchId, userId }) => {
  return await PoultryFinance.create({
    category: "poultry_sale",
    amount,
    quantity,
    relatedBatch: batchId,
    recordedBy: userId
  });
};

exports.recordEggSale = async ({ amount, quantity, userId }) => {
  return await PoultryFinance.create({
    category: "egg_sale",
    amount,
    quantity,
    recordedBy: userId
  });
};

exports.getLifetimeStats = async () => {
  const data = await PoultryFinance.aggregate([
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" }
      }
    }
  ]);

  let investment = 0, poultry = 0, eggs = 0;

  data.forEach(d => {
    if (d._id === "investment") investment = d.total;
    if (d._id === "poultry_sale") poultry = d.total;
    if (d._id === "egg_sale") eggs = d.total;
  });

  const revenue = poultry + eggs;
  const profit = revenue - investment;

  return { investment, poultry, eggs, revenue, profit };
};

exports.getMonthlyStats = async (year, month) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return await PoultryFinance.find({
    createdAt: { $gte: start, $lte: end }
  });
};