const Milk = require("../models/milk");
const Update = require("../models/Update");
const Financial = require("../models/financials");


/* =========================
   GET DAILY FINANCIAL DATA
========================= */
exports.computeDailyFinancials = async (day) => {

  /* =========================
     1. MILK INCOME
  ========================= */
  const milkAgg = await Milk.aggregate([
    { $match: { day } },
    {
      $group: {
        _id: null,
        totalCash: { $sum: "$dailyStats.cash" }
      }
    }
  ]);

  const milkCash = milkAgg[0]?.totalCash || 0;


  /* =========================
     2. EXPENSES (UPDATE MODEL)
  ========================= */
  const expenseAgg = await Update.aggregate([
    {
      $match: {
        $or: [
          { type: "maintenance" },
          { type: "medical" }
        ]
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

  let maintenanceCost = 0;
  let medicalCost = 0;

  expenseAgg.forEach(e => {
    if (e._id === "maintenance") maintenanceCost = e.total;
    if (e._id === "medical") medicalCost = e.total;
  });


  /* =========================
     3. SAVE FINANCIAL RECORD
  ========================= */
  return Financial.computeDailyFinancials({
    day,
    milkCash,
    maintenanceCost,
    medicalCost
  });
};


/* =========================
   GET MONTHLY FINANCIAL DATA
========================= */
exports.computeMonthlyFinancials = async (month) => {

  /* =========================
     1. MILK CASH
  ========================= */
  const milkAgg = await Milk.aggregate([
    { $match: { month } },
    {
      $group: {
        _id: null,
        totalCash: { $sum: "$dailyStats.cash" }
      }
    }
  ]);

  const milkCash = milkAgg[0]?.totalCash || 0;


  /* =========================
     2. EXPENSES
  ========================= */
  const expenseAgg = await Update.aggregate([
    {
      $addFields: {
        month: {
          $substr: ["$createdAt", 0, 7]
        }
      }
    },
    {
      $match: { month }
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

  let maintenanceCost = 0;
  let medicalCost = 0;

  expenseAgg.forEach(e => {
    if (e._id === "maintenance") maintenanceCost = e.total;
    if (e._id === "medical") medicalCost = e.total;
  });


  /* =========================
     3. SAVE MONTHLY FINANCIALS
  ========================= */
  return Financial.computeMonthlyFinancials({
    month,
    milkCash,
    maintenanceCost,
    medicalCost
  });
};


/* =========================
   GET YEARLY FINANCIAL DATA
========================= */
exports.computeYearlyFinancials = async (year) => {

  const milkAgg = await Milk.aggregate([
    {
      $addFields: {
        year: { $year: "$date" }
      }
    },
    { $match: { year } },
    {
      $group: {
        _id: null,
        totalCash: { $sum: "$dailyStats.cash" }
      }
    }
  ]);

  const milkCash = milkAgg[0]?.totalCash || 0;


  const expenseAgg = await Update.aggregate([
    {
      $addFields: {
        year: { $year: "$createdAt" }
      }
    },
    { $match: { year } },
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

  let maintenanceCost = 0;
  let medicalCost = 0;

  expenseAgg.forEach(e => {
    if (e._id === "maintenance") maintenanceCost = e.total;
    if (e._id === "medical") medicalCost = e.total;
  });


  return Financial.computeYearlyFinancials({
    year,
    milkCash,
    maintenanceCost,
    medicalCost
  });
};


/* =========================
   GET FINANCIAL RECORDS
========================= */
exports.getFinancials = async ({ day, month, year, type }) => {
  const filter = { periodType: type };

  if (day) filter.day = day;
  if (month) filter.month = month;
  if (year) filter.year = year;

  return Financial.findOne(filter);
};