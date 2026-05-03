const mongoose = require("mongoose");

const cageSchema = new mongoose.Schema(
{
  cageName: {
    type: String,
    required: true
  },

  poultryType: {
    type: String,
    default: "chicken"
  },

  total: {
    type: Number,
    required: true
  },

  available: {
    type: Number,
    required: true
  },

  dob: {
    type: Date,
    required: true
  },

  eggsAvailable: {
    type: Number,
    default: 0
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Cage", cageSchema);