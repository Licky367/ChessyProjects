const EggCollectionLog = require("../models/EggCollectionLog");
const PoultryFinance = require("../models/PoultryFinance");

const TYPES = ["chicken", "duck", "turkey", "goose", "quail", "other"];

const getRanges = (date) => {
  const d = date ? new Date(date) : new Date();

  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(d);
  dayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

  const yearStart = new Date(d.getFullYear(), 0, 1);
  const yearEnd = new Date(d.getFullYear(), 11, 31);

  return { dayStart, dayEnd, monthStart, monthEnd, yearStart, yearEnd };
};

exports.getStats = async ({ date, type }) => {
  const ranges = getRanges(date);

  const rows = [];

  // GRAND TOTALS (structured properly)
  let grandDay = 0;
  let grandMonth = 0;
  let grandYear = 0;

  for (const poultryType of TYPES) {
    let day = 0;
    let month = 0;
    let year = 0;

    // =========================
    // EGGS MODE
    // =========================
    if (type === "eggs") {
      const [dayData, monthData, yearData] = await Promise.all([
        EggCollectionLog.find({
          poultryType,
          createdAt: { $gte: ranges.dayStart, $lte: ranges.dayEnd }
        }),
        EggCollectionLog.find({
          poultryType,
          createdAt: { $gte: ranges.monthStart, $lte: ranges.monthEnd }
        }),
        EggCollectionLog.find({
          poultryType,
          createdAt: { $gte: ranges.yearStart, $lte: ranges.yearEnd }
        })
      ]);

      day = dayData.reduce((a, b) => a + b.quantity, 0);
      month = monthData.reduce((a, b) => a + b.quantity, 0);
      year = yearData.reduce((a, b) => a + b.quantity, 0);
    }

    // =========================
    // SALES MODE
    // =========================
    if (type === "sales") {
      const base = {
        category: "egg_sale",
        poultryType
      };

      const [dayData, monthData, yearData] = await Promise.all([
        PoultryFinance.find({
          ...base,
          createdAt: { $gte: ranges.dayStart, $lte: ranges.dayEnd }
        }),
        PoultryFinance.find({
          ...base,
          createdAt: { $gte: ranges.monthStart, $lte: ranges.monthEnd }
        }),
        PoultryFinance.find({
          ...base,
          createdAt: { $gte: ranges.yearStart, $lte: ranges.yearEnd }
        })
      ]);

      day = dayData.reduce((a, b) => a + b.amount, 0);
      month = monthData.reduce((a, b) => a + b.amount, 0);
      year = yearData.reduce((a, b) => a + b.amount, 0);
    }

    // accumulate grand totals
    grandDay += day;
    grandMonth += month;
    grandYear += year;

    rows.push({
      poultryType,
      day,
      month,
      year
    });
  }

  return {
    rows,
    grandTotal: {
      day: grandDay,
      month: grandMonth,
      year: grandYear
    }
  };
};