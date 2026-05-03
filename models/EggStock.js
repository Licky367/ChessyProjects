const mongoose = require("mongoose");

const eggStockSchema = new mongoose.Schema(
  {
    poultryType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ["chicken", "duck", "turkey", "goose", "quail", "other"]
    },

    totalAvailable: { type: Number, default: 0, min: 0 },

    totalCollected: { type: Number, default: 0, min: 0 },

    totalSold: { type: Number, default: 0, min: 0 },

    /**
     * NEW: helps reporting per day/month/year without guessing
     */
    dailyRecords: [
      {
        date: { type: Date, required: true },
        collected: { type: Number, default: 0 },
        sold: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

eggStockSchema.index({ poultryType: 1 }, { unique: true });

module.exports = mongoose.model("EggStock", eggStockSchema);