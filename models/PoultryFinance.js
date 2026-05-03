const mongoose = require("mongoose");

const poultryFinanceSchema = new mongoose.Schema(
  {
    /**
     * Type of financial transaction
     */
    category: {
      type: String,
      enum: {
        values: ["investment", "poultry_sale", "egg_sale", "expense", "feed_purchase", "medicine_purchase"],
        message: "Invalid finance category"
      },
      required: true
    },

    /**
     * Money involved in transaction
     */
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"]
    },

    /**
     * Quantity involved (birds, eggs, bags of feed, etc.)
     */
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },

    /**
     * Optional description for clarity
     */
    description: {
      type: String,
      trim: true,
      maxlength: 300
    },

    /**
     * Indicates whether money came in or went out
     */
    direction: {
      type: String,
      enum: ["income", "expense"],
      required: true
    },

    /**
     * Payment method (cash, mobile money, bank, etc.)
     */
    paymentMethod: {
      type: String,
      enum: ["cash", "mpesa", "bank", "credit", "other"],
      default: "cash"
    },

    /**
     * Related production batch (birds/eggs source)
     */
    relatedBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NursingBatch"
    },

    /**
     * User who recorded the transaction
     */
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /**
     * Optional: running balance after transaction (for fast reports)
     */
    balanceAfter: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

/**
 * INDEXES FOR PERFORMANCE + REPORTING
 */
poultryFinanceSchema.index({ category: 1 });
poultryFinanceSchema.index({ createdAt: -1 });
poultryFinanceSchema.index({ recordedBy: 1 });

/**
 * =========================
 * INSTANCE HELPERS
 * =========================
 */

// Mark transaction as income automatically (helper)
poultryFinanceSchema.methods.markIncome = function () {
  this.direction = "income";
  return this;
};

// Mark transaction as expense automatically (helper)
poultryFinanceSchema.methods.markExpense = function () {
  this.direction = "expense";
  return this;
};

module.exports = mongoose.model("PoultryFinance", poultryFinanceSchema);