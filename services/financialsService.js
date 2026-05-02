const Milk = require("../models/milk");
const Update = require("../models/Update");
const Financial = require("../models/financials");


/* =========================================================
   HELPERS
========================================================= */

/**
 * Extract expense totals (maintenance + medical)
 */
const computeExpenseTotals = (expenseAgg) => {
  let maintenanceCost = 0;
  let medicalCost = 0;

  expenseAgg.forEach(e => {
    if (e._id === "maintenance") maintenanceCost = e.total;
    if (e._id === "medical") medicalCost = e.total;
  });

  return { maintenanceCost, medicalCost };
};


/**
 * Milk aggregation helper
 */
const getMilkCash = async (match) => {
  const result = await Milk.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCash: { $sum: "$dailyStats.cash" }
      }
    }
  ]);

  return result[0]?.totalCash || 0;
};


/**
 * Expense aggregation helper
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
   OPTIONAL: RAW RECORD ACCESS
========================================================= */
exports.getRawRecord = async (query) => {
  return Financial.find(query);
};