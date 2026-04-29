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
        return this.code >= 0; // Required only for animals (0 or positive code)
      },
      default: null
    },

    mass: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    isMilking: {
      type: Boolean,
      default: false,
      validate: {
        validator: function (value) {
          // Only female animals can be marked as milking
          if (value === true && this.code >= 0 && this.code % 2 !== 0) {
            return false;
          }

          // Facilities / negative codes cannot be milked
          if (value === true && this.code < 0) {
            return false;
          }

          return true;
        },
        message: 'Only female animals can be marked as being milked.'
      }
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
  if (this.code < 0) return null; // Facilities / no gender
  return this.code % 2 === 0 ? 'Female' : 'Male';
});

module.exports = mongoose.model('Dairy', dairySchema);