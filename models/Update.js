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
    trim: true
  },

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
  =========================
     This is what drives the feed rendering:
     - post
     - comment (legacy / medical comments)
     - image
     - medical (optional snapshot event)
  ========================= */
  type: {
    type: String,
    enum: ['image', 'comment', 'post', 'medical'],
    required: true,
    index: true
  },


  /* =========================
     LEGACY COMMENT FIELD
     (used by medical/general comments)
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
     SOCIAL FEATURES (POST ONLY)
  ========================= */
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  comments: [commentSchema],


  /* =========================
     MEDICAL SNAPSHOT (OPTIONAL)
     ⚠️ This is NOT used in feed rendering anymore
     Feed now comes from service-layer merge
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