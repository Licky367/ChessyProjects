const Milk = require("../models/milk");
const Update = require("../models/Update");
const Financial = require("../models/financials");


/* =========================================================
   HELPERS
========================================================= */

/**
 * Extract expense totals
 */
const computeExpenseTotals = (expenseAgg) => {
  let maintenanceCost = 0;
  let medicalCost = 0;

  expenseAgg.forEach(e => {
    if (e._id === "maintenance") maintenanceCost = e.total || 0;
    if (e._id === "medical") medicalCost = e.total || 0;
  });

  return { maintenanceCost, medicalCost };
};


/**
 * MILK CASH (UPDATED LOGIC)
 * -------------------------
 * Priority:
 * 1. sales.cash (PRIMARY SOURCE)
 * 2. fallback: dailyStats.cash (LEGACY SAFETY)
 */
const getMilkCash = async (match) => {
  const result = await Milk.aggregate([
    { $match: match },

    {
      $unwind: {
        path: "$sales",
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $group: {
        _id: null,
        totalCash: { $sum: { $ifNull: ["$sales.cash", 0] } }
      }
    }
  ]);

  const cashFromSales = result[0]?.totalCash || 0;

  // fallback safety (if no sales exist yet)
  if (cashFromSales > 0) return cashFromSales;

  const fallback = await Milk.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCash: { $sum: "$dailyStats.cash" }
      }
    }
  ]);

  return fallback[0]?.totalCash || 0;
};


/**
 * EXPENSE AGGREGATION (UNCHANGED BUT CLEANED)
 */
const getExpenseAgg = async (match) => {
  return await Update.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        total: {
          $sum: {
            $cond: [
              { $eq: ["$type", "maintenance"] },
              "$maintenance.charges",
              "$medical.charges"
            ]
          }
        }
      }
    }
  ]);
};


/* =========================================================
   DAILY FINANCIALS
========================================================= */
exports.computeDailyFinancials = async (day) => {

  const milkCash = await getMilkCash({ day });

  const expenseAgg = await getExpenseAgg({});

  const { maintenanceCost, medicalCost } =
    computeExpenseTotals(expenseAgg);

  return Financial.computeDailyFinancials({
    day,
    milkCash,
    maintenanceCost,
    medicalCost
  });
};


/* =========================================================
   MONTHLY FINANCIALS
========================================================= */
exports.computeMonthlyFinancials = async (month, year) => {

  const milkCash = await getMilkCash({ month });

  const expenseAgg = await Update.aggregate([
    {
      $addFields: {
        month: { $substr: ["$createdAt", 0, 7] }
      }
    },
    {
      $match: {
        month,
        ...(year && {
          $expr: { $eq: [{ $year: "$createdAt" }, Number(year)] }
        })
      }
    },
    {
      $group: {
        _id: "$type",
        total: {
          $sum: {
            $cond: [
              { $eq: ["$type", "maintenance"] },
              "$maintenance.charges",
              "$medical.charges"
            ]
          }
        }
      }
    }
  ]);

  const { maintenanceCost, medicalCost } =
    computeExpenseTotals(expenseAgg);

  return Financial.computeMonthlyFinancials({
    month,
    year,
    milkCash,
    maintenanceCost,
    medicalCost
  });
};


/* =========================================================
   YEARLY FINANCIALS
========================================================= */
exports.computeYearlyFinancials = async (year) => {

  const milkCash = await getMilkCash({
    $expr: { $eq: [{ $year: "$date" }, Number(year)] }
  });

  const expenseAgg = await getExpenseAgg({
    $expr: { $eq: [{ $year: "$createdAt" }, Number(year)] }
  });

  const { maintenanceCost, medicalCost } =
    computeExpenseTotals(expenseAgg);

  return Financial.computeYearlyFinancials({
    year,
    milkCash,
    maintenanceCost,
    medicalCost
  });
};


/* =========================================================
   GET STORED FINANCIAL RECORD
========================================================= */
exports.getFinancials = async ({ day, month, year, type }) => {
  const filter = { periodType: type };

  if (day) filter.day = day;
  if (month) filter.month = month;
  if (year) filter.year = Number(year);

  return Financial.findOne(filter);
};


/* =========================================================
   RAW DATA ACCESS
========================================================= */
exports.getRawRecord = async (query) => {
  return Financial.find(query);
};