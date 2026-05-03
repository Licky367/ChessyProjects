const mongoose = require("mongoose");

const eggStockSchema = new mongoose.Schema(
  {
    // Type of poultry producing eggs
    poultryType: {
      type: String,
      required: [true, "Poultry type is required"],
      trim: true,
      lowercase: true,
      enum: {
        values: ["chicken", "duck", "turkey", "goose", "quail", "other"],
        message: "Invalid poultry type"
      }
    },

    // Total eggs currently available
    totalAvailable: {
      type: Number,
      default: 0,
      min: [0, "Egg stock cannot be negative"]
    },

    // Optional: eggs added manually or collected
    totalCollected: {
      type: Number,
      default: 0,
      min: 0
    },

    // Optional: eggs sold
    totalSold: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

/**
 * Ensure only one record per poultry type
 */
eggStockSchema.index({ poultryType: 1 }, { unique: true });

/**
 * =========================
 * INSTANCE METHODS
 * =========================
 */

// Add eggs to stock (collection)
eggStockSchema.methods.addEggs = function (quantity = 0) {
  if (quantity <= 0) throw new Error("Quantity must be greater than 0");

  this.totalAvailable += quantity;
  this.totalCollected += quantity;

  return this.save();
};

// Remove eggs when sold
eggStockSchema.methods.sellEggs = function (quantity = 0) {
  if (quantity <= 0) throw new Error("Quantity must be greater than 0");
  if (this.totalAvailable < quantity) {
    throw new Error("Insufficient egg stock");
  }

  this.totalAvailable -= quantity;
  this.totalSold += quantity;

  return this.save();
};

/**
 * =========================
 * STATIC METHODS
 * =========================
 */

// Get or create stock record for a poultry type
eggStockSchema.statics.getOrCreateStock = async function (poultryType) {
  let stock = await this.findOne({ poultryType });

  if (!stock) {
    stock = await this.create({
      poultryType,
      totalAvailable: 0,
      totalCollected: 0,
      totalSold: 0
    });
  }

  return stock;
};

module.exports = mongoose.model("EggStock", eggStockSchema);