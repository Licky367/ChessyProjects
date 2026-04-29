// models/dairy.js

const mongoose = require('mongoose');

const dairySchema = new mongoose.Schema(
  {
    profileImage: {
      type: String,
      trim: true,
      default: ''
    },

    code: {
      type: Number,
      required: true,
      unique: true,
      validate: {
        validator: Number.isInteger,
        message: 'Code must be a whole number.'
      }
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    dob: {
      type: Date,
      required: function () {
        return this.code >= 0; // Required only when code is zero or positive
      },
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual gender field based on code
dairySchema.virtual('gender').get(function () {
  if (this.code < 0) return null; // No gender for negative code
  return this.code % 2 === 0 ? 'Female' : 'Male';
});

module.exports = mongoose.model('Dairy', dairySchema);