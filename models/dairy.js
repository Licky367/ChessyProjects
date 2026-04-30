const mongoose = require('mongoose');

const dairySchema = new mongoose.Schema(
  {
    /* =========================
       PROFILE IMAGE
    ========================= */
    profileImage: {
      type: String,
      trim: true,
      default: ''
    },

    /* =========================
       UNIQUE CODE
    ========================= */
    code: {
      type: Number,
      required: true,
      unique: true,
      validate: {
        validator: Number.isInteger,
        message: 'Code must be a whole number.'
      }
    },

    /* =========================
       NAME
    ========================= */
    name: {
      type: String,
      required: true,
      trim: true
    },

    /* =========================
       DATE OF BIRTH
    ========================= */
    dob: {
      type: Date,
      required: function () {
        return this.code >= 0;
      },
      default: null
    },

    /* =========================
       MASS
    ========================= */
    mass: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    /* =========================
       MILKING STATUS
    ========================= */
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

    /* =========================
       🚑 MEDICAL ATTENTION SYSTEM
    ========================= */
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
      },

      updatedAt: {
        type: Date,
        default: null
      }
    }
  },

  {
    timestamps: true,
    minimize: false, // 🔥 KEEP EMPTY OBJECTS (important for medicalAttention)
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


/* =========================
   VIRTUALS
========================= */

// Gender
dairySchema.virtual('gender').get(function () {
  if (this.code < 0) return null;
  return this.code % 2 === 0 ? 'Female' : 'Male';
});

// Female check
dairySchema.virtual('isFemale').get(function () {
  return this.code >= 0 && this.code % 2 === 0;
});

// Identity check
dairySchema.virtual('hasIdentity').get(function () {
  return this.code >= 0;
});

// Medical shortcut
dairySchema.virtual('needsMedicalAttention').get(function () {
  return !!(this.medicalAttention && this.medicalAttention.isMarked);
});


/* =========================
   PRE-VALIDATE (🔥 STRONGER THAN PRE-SAVE)
========================= */
dairySchema.pre('validate', function (next) {

  // enforce milking rule
  if (!this.isFemale) {
    this.isMilking = false;
  }

  // remove DOB for non-animals
  if (this.code < 0) {
    this.dob = null;
  }

  // ensure medical structure ALWAYS exists
  if (!this.medicalAttention) {
    this.medicalAttention = {};
  }

  // normalize medical fields
  this.medicalAttention.isMarked = !!this.medicalAttention.isMarked;
  this.medicalAttention.type = this.medicalAttention.type || '';
  this.medicalAttention.details = this.medicalAttention.details || '';
  this.medicalAttention.markedBy = this.medicalAttention.markedBy || null;
  this.medicalAttention.markedAt = this.medicalAttention.markedAt || null;
  this.medicalAttention.updatedAt = this.medicalAttention.updatedAt || null;

  next();
});


/* =========================
   PRE-SAVE (AUDIT SAFETY)
========================= */
dairySchema.pre('save', function (next) {

  // auto-update timestamp when medical changes
  if (this.isModified('medicalAttention')) {
    this.medicalAttention.updatedAt = new Date();
  }

  next();
});


/* =========================
   INDEXES
========================= */

// Strong unique index
dairySchema.index({ code: 1 }, { unique: true });

// Optional: fast filtering later (very useful)
dairySchema.index({ 'medicalAttention.isMarked': 1 });


/* =========================
   EXPORT
========================= */
module.exports = mongoose.model('Dairy', dairySchema);