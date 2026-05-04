const mongoose = require("mongoose");

const VALID_POULTRY_TYPES = [
  "chicken",
  "duck",
  "turkey",
  "goose",
  "quail",
  "other"
];

const VALID_CATEGORIES = [
  "investment",
  "poultry_sale",
  "egg_sale"
];

// =========================
// FINANCE SCHEMA
// =========================
const poultryFinanceSchema = new mongoose.Schema(
  {
    // Main financial category (income vs expense grouping)
    category: {
      type: String,
      enum: VALID_CATEGORIES,
      required: true
    },

    // Internal classification of investment usage
    // (reinvest, pay_workers, consumption, initial_investment)
    metaType: {
      type: String,
      enum: ["investment", "reinvest", "pay_workers", "consumption"],
      default: "investment"
    },

    // Poultry type involved
    poultryType: {
      type: String,
      enum: VALID_POULTRY_TYPES,
      required: true,
      trim: true
    },

    // Monetary value
    amount: {
      type: Number,
      required: true,
      min: 0,
      set: v => Math.max(0, Number(v))
    },

    // Quantity (birds or eggs depending on transaction)
    quantity: {
      type: Number,
      default: 0,
      min: 0,
      set: v => Math.max(0, Number(v))
    },

    // Optional note
    description: {
      type: String,
      trim: true,
      default: ""
    },

    // Related batch if applicable
    relatedBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NursingBatch"
    },

    // User who recorded transaction
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// =========================
// INDEXING FOR PERFORMANCE
// =========================
poultryFinanceSchema.index({ category: 1, poultryType: 1 });
poultryFinanceSchema.index({ metaType: 1 });
poultryFinanceSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PoultryFinance", poultryFinanceSchema);