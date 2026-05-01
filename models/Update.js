const mongoose = require('mongoose');


/* =========================
   COMMENT SUB-SCHEMA
========================= */
const commentSchema = new mongoose.Schema({

  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  userName: String,

  text: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

}, { _id: false });


/* =========================
   MAINTENANCE SUB-SCHEMA
========================= */
const maintenanceSchema = new mongoose.Schema({

  /* =========================
     STATE
  ========================= */
  status: {
    type: String,
    enum: ['marked', 'cleared'],
    required: true,
    index: true
  },

  /* =========================
     MARK EVENT
  ========================= */
  type: {
    type: String,
    enum: ['repair', 'maintenance', 'construction'],
  },

  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  markedAt: {
    type: Date
  },

  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },


  /* =========================
     CLEAR EVENT
  ========================= */
  clearedAt: {
    type: Date
  },

  clearedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  charges: {
    type: Number,
    default: 0,
    min: 0
  },

  clearDescription: {
    type: String,
    trim: true,
    maxlength: 1000
  }

}, { _id: false });


/* =========================
   MAIN UPDATE SCHEMA
========================= */
const updateSchema = new mongoose.Schema({

  /* =========================
     RELATIONS
  ========================= */
  dairy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dairy',
    required: true,
    index: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },


  /* =========================
     UNIFIED TYPE SYSTEM
  ========================= */
  type: {
    type: String,
    enum: ['image', 'comment', 'post', 'medical', 'maintenance', 'milk'],
    required: true,
    index: true
  },


  /* =========================
     LEGACY COMMENT FIELD
  ========================= */
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },


  /* =========================
     POST CONTENT
  ========================= */
  text: {
    type: String,
    trim: true,
    maxlength: 2000
  },

  image: {
    type: String,
    default: null
  },


  /* =========================
     SOCIAL FEATURES
  ========================= */
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  comments: [commentSchema],


  /* =========================
     MAINTENANCE SYSTEM
  ========================= */
  maintenance: maintenanceSchema,


  /* =========================
     LEGACY MEDICAL SYSTEM
  ========================= */
  medical: {
    isMarked: { type: Boolean, default: false },

    type: String,

    details: String,

    markedAt: Date,

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }

}, {
  timestamps: true
});


/* =========================
   INDEXES
========================= */
updateSchema.index({ dairy: 1, createdAt: -1 });
updateSchema.index({ type: 1 });
updateSchema.index({ 'maintenance.status': 1 });
updateSchema.index({ 'medical.isMarked': 1 });


module.exports = mongoose.model('Update', updateSchema);