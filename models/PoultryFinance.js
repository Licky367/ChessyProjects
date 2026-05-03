const mongoose = require("mongoose");

const poultryFinanceSchema = new mongoose.Schema(
{
  category: {
    type: String,
    enum: ["investment", "poultry_sale", "egg_sale"],
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  quantity: {
    type: Number, // eggs or birds sold
    default: 0
  },

  description: {
    type: String,
    trim: true
  },

  relatedBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NursingBatch"
  },

  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("PoultryFinance", poultryFinanceSchema);