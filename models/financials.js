const mongoose = require("mongoose");


/* =========================
   FINANCIAL SCHEMA
========================= */
const financialSchema = new mongoose.Schema({

  /* =========================
     PERIOD CONTROL
  ========================= */
  periodType: {
    type: String,
    enum: ["daily", "monthly", "yearly"],
    required: true,
    index: true
  },

  day: { type: String, index: true },     // YYYY-MM-DD
  month: { type: String, index: true },   // YYYY-MM
  year: { type: Number, index: true },


  /* =========================
     CASH INFLOW (MILK REVENUE)
     - from Milk.sales + dailyStats.cash
  ========================= */
  milkCash: {
    type: Number,
    default: 0
  },


  /* =========================
     CASH OUTFLOW (EXPENSES)
     - from Update model
  ========================= */
  maintenanceCost: {
    type: Number,
    default: 0
  },

  medicalCost: {
    type: Number,
    default: 0
  },

  totalExpenses: {
    type: Number,
    default: 0
  },


  /* =========================
     PROFIT
  ========================= */
  profit: {
    type: Number,
    default: 0
  },


  /* =========================
     LOCK SYSTEM
  ========================= */
  locked: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});


/* =========================
   INDEXES (ANTI-DUPLICATION SAFETY)
========================= */
financialSchema.index(
  { periodType: 1, day: 1 },
  { unique: true, sparse: true }
);

financialSchema.index(
  { periodType: 1, month: 1 },
  { unique: true, sparse: true }
);

financialSchema.index(
  { periodType: 1, year: 1 },
  { unique: true, sparse: true }
);


/* =========================
   STATIC: CALCULATE DAILY FINANCIALS
========================= */
financialSchema.statics.computeDailyFinancials = async function ({
  day,
  milkCash,
  maintenanceCost,
  medicalCost
}) {

  const totalExpenses = (maintenanceCost || 0) + (medicalCost || 0);
  const profit = (milkCash || 0) - totalExpenses;

  return this.findOneAndUpdate(
    { periodType: "daily", day },
    {
      $set: {
        milkCash,
        maintenanceCost,
        medicalCost,
        totalExpenses,
        profit,
        locked: true
      }
    },
    { upsert: true, new: true }
  );
};


/* =========================
   STATIC: MONTHLY FINANCIALS
========================= */
financialSchema.statics.computeMonthlyFinancials = async function ({
  month,
  milkCash,
  maintenanceCost,
  medicalCost
}) {

  const totalExpenses = (maintenanceCost || 0) + (medicalCost || 0);
  const profit = (milkCash || 0) - totalExpenses;

  return this.findOneAndUpdate(
    { periodType: "monthly", month },
    {
      $set: {
        milkCash,
        maintenanceCost,
        medicalCost,
        totalExpenses,
        profit,
        locked: true
      }
    },
    { upsert: true, new: true }
  );
};


/* =========================
   STATIC: YEARLY FINANCIALS
========================= */
financialSchema.statics.computeYearlyFinancials = async function ({
  year,
  milkCash,
  maintenanceCost,
  medicalCost
}) {

  const totalExpenses = (maintenanceCost || 0) + (medicalCost || 0);
  const profit = (milkCash || 0) - totalExpenses;

  return this.findOneAndUpdate(
    { periodType: "yearly", year },
    {
      $set: {
        milkCash,
        maintenanceCost,
        medicalCost,
        totalExpenses,
        profit,
        locked: true
      }
    },
    { upsert: true, new: true }
  );
};


/* =========================
   EXPORT MODEL
========================= */
module.exports = mongoose.model("Financial", financialSchema);