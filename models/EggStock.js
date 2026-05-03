const mongoose = require("mongoose");

const eggStockSchema = new mongoose.Schema(
{
  poultryType: {
    type: String,
    required: true
  },

  totalAvailable: {
    type: Number,
    default: 0
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("EggStock", eggStockSchema);