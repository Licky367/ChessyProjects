const mongoose = require("mongoose");

const VALID_POULTRY_TYPES = [
  "chicken",
  "duck",
  "turkey",
  "goose",
  "quail",
  "other"
];

const poultryFinanceSchema = new mongoose.Schema(
  {
    // Type of financial record
    category: {
      type: String,
      enum: ["investment", "poultry_sale", "egg_sale"],
      required: true
    },

    // Poultry type involved in transaction (critical for analytics)
    poultryType: {
      type: String,
      enum: VALID_POULTRY_TYPES,
      required: false,
      trim: true
    },

    // Monetary value of transaction
    amount: {
      type: Number,
      required: true,
      min: 0
    },

    // Quantity of items (birds or eggs)
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },

    // Optional human-readable note
    description: {
      type: String,
      trim: true
    },

    // Related batch (if applicable)
    relatedBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NursingBatch"
    },

    // User who recorded the transaction
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// Index for faster financial reporting by category + poultry type
poultryFinanceSchema.index({ category: 1, poultryType: 1 });

module.exports = mongoose.model("PoultryFinance", poultryFinanceSchema);