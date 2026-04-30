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
          if (value && this.code < 0) return false;
          if (value && this.code >= 0 && this.code % 2 !== 0) return false;
          return true;
        },
        message: 'Only female animals can be marked as being milked.'
      }
    },

    // =========================
    // MEDICAL ATTENTION SYSTEM
    // =========================
    medicalAttention: {
      isMarked: {
        type: Boolean,
        default: false
      },

      type: {
        type: String,
        trim: true,
        default: ''
      },

      details: {
        type: String,
        trim: true,
        default: ''
      },

      markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },

      markedAt: {
        type: Date,
        default: null
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

// Female helper
dairySchema.virtual('isFemale').get(function () {
  return this.code >= 0 && this.code % 2 === 0;
});

// Identity helper (valid animal vs facility)
dairySchema.virtual('hasIdentity').get(function () {
  return this.code >= 0;
});

// Medical shortcut helper
dairySchema.virtual('needsMedicalAttention').get(function () {
  return this.medicalAttention && this.medicalAttention.isMarked;
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