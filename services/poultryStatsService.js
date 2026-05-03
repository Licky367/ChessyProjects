const EggStock = require("../models/EggStock");
const PoultryFinance = require("../models/PoultryFinance");

function getDateRange(date) {
  const d = new Date(date);

  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

  const yearStart = new Date(d.getFullYear(), 0, 1);
  const yearEnd = new Date(d.getFullYear() + 1, 0, 1);

  return { dayStart, dayEnd, monthStart, monthEnd, yearStart, yearEnd };
}

exports.getEggCollectionStats = async (date) => {
  const { dayStart, dayEnd, monthStart, monthEnd, yearStart, yearEnd } = getDateRange(date);

  const stocks = await EggStock.find();

  let results = [];

  for (const stock of stocks) {
    const daily = stock.dailyRecords || [];

    const dayTotal = daily
      .filter(d => d.date >= dayStart && d.date < dayEnd)
      .reduce((a, b) => a + b.collected, 0);

    const monthTotal = daily
      .filter(d => d.date >= monthStart && d.date < monthEnd)
      .reduce((a, b) => a + b.collected, 0);

    const yearTotal = daily
      .filter(d => d.date >= yearStart && d.date < yearEnd)
      .reduce((a, b) => a + b.collected, 0);

    const overall = stock.totalCollected;

    results.push({
      poultryType: stock.poultryType,
      dayTotal,
      monthTotal,
      yearTotal,
      overall
    });
  }

  return results;
};

exports.getEggSalesStats = async (date) => {
  const { dayStart, dayEnd, monthStart, monthEnd, yearStart, yearEnd } = getDateRange(date);

  const baseFilter = { category: "egg_sale", direction: "income" };

  const day = await PoultryFinance.aggregate([
    { $match: { ...baseFilter, transactionDate: { $gte: dayStart, $lt: dayEnd } } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const month = await PoultryFinance.aggregate([
    { $match: { ...baseFilter, transactionDate: { $gte: monthStart, $lt: monthEnd } } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const year = await PoultryFinance.aggregate([
    { $match: { ...baseFilter, transactionDate: { $gte: yearStart, $lt: yearEnd } } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const overall = await PoultryFinance.aggregate([
    { $match: baseFilter },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  return {
    dayTotal: day[0]?.total || 0,
    monthTotal: month[0]?.total || 0,
    yearTotal: year[0]?.total || 0,
    overall: overall[0]?.total || 0
  };
};