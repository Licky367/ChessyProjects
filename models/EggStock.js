const mongoose = require("mongoose");

const eggStockSchema = new mongoose.Schema(
  {
    // Type of poultry producing these eggs
    poultryType: {
      type: String,
      required: true,
      trim: true,
      enum: ["chicken", "duck", "turkey", "goose", "quail", "other"]
    },

    // Total eggs available for this poultry type
    totalAvailable: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Optional but strongly recommended:
// Ensures one document per poultry type (prevents duplicates like multiple "chicken" rows)
eggStockSchema.index({ poultryType: 1 }, { unique: true });

module.exports = mongoose.model("EggStock", eggStockSchema);