// models/dairy.js

const mongoose = require('mongoose');

const dairySchema = new mongoose.Schema(
  {
    // =========================
    // PROFILE IMAGE
    // =========================
    profileImage: {
      type: String,
      trim: true,
      default: ''
    },

    // =========================
    // UNIQUE CODE
    // =========================
    code: {
      type: Number,
      required: true,
      unique: true,
      validate: {
        validator: Number.isInteger,
        message: 'Code must be a whole number.'
      }
    },

    // =========================
    // NAME
    // =========================
    name: {
      type: String,
      required: true,
      trim: true
    },

    // =========================
    // DATE OF BIRTH
    // =========================
    dob: {
      type: Date,
      required: function () {
        return this.code >= 0; // Only real animals require DOB
      },
      default: null
    },

    // =========================
    // MASS
    // =========================
    mass: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    // =========================
    // MILKING STATUS
    // =========================
    isMilking: {
      type: Boolean,
      default: false,
      validate: {
        validator: function (value) {
          // Facilities (negative code) cannot be milked
          if (value && this.code < 0) return false;

          // Only FEMALES (even codes) can be milked
          if (value && this.code >= 0 && this.code % 2 !== 0) return false;

          return true;
        },
        message: 'Only female animals can be marked as being milked.'
      }
    }
  },
  {
    timestamps: true,

    // allow virtuals in JSON & EJS
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


// =========================
// VIRTUALS
// =========================

// Gender (derived from code)
dairySchema.virtual('gender').get(function () {
  if (this.code < 0) return null;
  return this.code % 2 === 0 ? 'Female' : 'Male';
});

// Boolean helpers (VERY IMPORTANT for your service/UI)
dairySchema.virtual('isFemale').get(function () {
  return this.code >= 0 && this.code % 2 === 0;
});

dairySchema.virtual('hasIdentity').get(function () {
  return this.code >= 0;
});


// =========================
// PRE-SAVE HOOK (DATA SAFETY)
// =========================
dairySchema.pre('save', function (next) {

  // If not female → force isMilking false
  if (!this.isFemale) {
    this.isMilking = false;
  }

  // If facility → remove DOB
  if (this.code < 0) {
    this.dob = null;
  }

  next();
});


// =========================
// INDEXES (PERFORMANCE)
// =========================
dairySchema.index({ code: 1 }, { unique: true });


// =========================
// EXPORT
// =========================
module.exports = mongoose.model('Dairy', dairySchema);