const mongoose = require("mongoose");

const poultryFinanceSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["investment", "poultry_sale", "egg_sale", "expense", "feed_purchase", "medicine_purchase"],
      required: true
    },

    amount: { type: Number, required: true, min: 0 },

    quantity: { type: Number, default: 0, min: 0 },

    direction: {
      type: String,
      enum: ["income", "expense"],
      required: true
    },

    /**
     * NEW: date normalization for grouping reports
     */
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true
    },

    description: String,

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

poultryFinanceSchema.index({ transactionDate: 1 });
poultryFinanceSchema.index({ category: 1 });

module.exports = mongoose.model("PoultryFinance", poultryFinanceSchema);