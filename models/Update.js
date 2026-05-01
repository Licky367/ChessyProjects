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
  text: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });


/* =========================
   MAIN UPDATE SCHEMA
========================= */
const updateSchema = new mongoose.Schema({

  /* =========================
     RELATIONSHIP
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
     TYPE SYSTEM
  ========================= */
  type: {
    type: String,
    enum: [
      'image',
      'comment',
      'post',
      'medical'
    ],
    required: true,
    index: true
  },

  /* =========================
     🔥 LEGACY + MEDICAL COMMENTS
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
     OPTIONAL MEDICAL SNAPSHOT
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
   INDEXES (PERFORMANCE)
========================= */
updateSchema.index({ dairy: 1, createdAt: -1 });
updateSchema.index({ type: 1 });


module.exports = mongoose.model('Update', updateSchema);