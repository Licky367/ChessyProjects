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
     CASH INFLOW (FROM MILK)
  ========================= */
  milkCash: {
    type: Number,
    default: 0
  },


  /* =========================
     CASH OUTFLOW (EXPENSES)
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
     LOCK SYSTEM (IMPORTANT)
  ========================= */
  locked: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});


/* =========================
   UNIQUE INDEXES (PREVENT DUPLICATES)
========================= */
financialSchema.index({ periodType: 1, day: 1 }, { unique: true, sparse: true });
financialSchema.index({ periodType: 1, month: 1 }, { unique: true, sparse: true });
financialSchema.index({ periodType: 1, year: 1 }, { unique: true, sparse: true });