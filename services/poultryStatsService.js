const EggCollectionLog = require("../models/EggCollectionLog");
const PoultryFinance = require("../models/PoultryFinance");

const TYPES = ["chicken", "duck", "turkey", "goose", "quail", "other"];

const getRanges = (date) => {
  const d = date ? new Date(date) : new Date();

  const dayStart = new Date(d.setHours(0, 0, 0, 0));
  const dayEnd = new Date(d.setHours(23, 59, 59, 999));

  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

  const yearStart = new Date(d.getFullYear(), 0, 1);
  const yearEnd = new Date(d.getFullYear(), 11, 31);

  return { dayStart, dayEnd, monthStart, monthEnd, yearStart, yearEnd };
};

exports.getStats = async ({ date, type }) => {
  const ranges = getRanges(date);

  const rows = [];
  let total = 0;

  for (const poultryType of TYPES) {
    let day = 0;
    let month = 0;
    let year = 0;

    if (type === "eggs") {
      const dayData = await EggCollectionLog.find({
        poultryType,
        createdAt: { $gte: ranges.dayStart, $lte: ranges.dayEnd }
      });

      const monthData = await EggCollectionLog.find({
        poultryType,
        createdAt: { $gte: ranges.monthStart, $lte: ranges.monthEnd }
      });

      const yearData = await EggCollectionLog.find({
        poultryType,
        createdAt: { $gte: ranges.yearStart, $lte: ranges.yearEnd }
      });

      day = dayData.reduce((a, b) => a + b.quantity, 0);
      month = monthData.reduce((a, b) => a + b.quantity, 0);
      year = yearData.reduce((a, b) => a + b.quantity, 0);

      total += year;
    }

    if (type === "sales") {
      const base = {
        category: "egg_sale",
        poultryType
      };

      const dayData = await PoultryFinance.find({
        ...base,
        createdAt: { $gte: ranges.dayStart, $lte: ranges.dayEnd }
      });

      const monthData = await PoultryFinance.find({
        ...base,
        createdAt: { $gte: ranges.monthStart, $lte: ranges.monthEnd }
      });

      const yearData = await PoultryFinance.find({
        ...base,
        createdAt: { $gte: ranges.yearStart, $lte: ranges.yearEnd }
      });

      day = dayData.reduce((a, b) => a + b.amount, 0);
      month = monthData.reduce((a, b) => a + b.amount, 0);
      year = yearData.reduce((a, b) => a + b.amount, 0);

      total += year;
    }

    rows.push({ poultryType, day, month, year });
  }

  return { rows, total };
};