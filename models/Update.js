const mongoose = require('mongoose');

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
     CORE CONTENT TYPES
  ========================= */

  type: {
    type: String,
    enum: [
      'image',        // profile/image update
      'comment',      // dairy/medical comment
      'post',         // social feed post
      'medical'       // optional medical log entry
    ],
    required: true,
    index: true
  },

  /* =========================
     POST / FEED CONTENT
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
     MEDICAL SNAPSHOT (OPTIONAL)
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
   INDEXES (IMPORTANT FOR FEED SPEED)
========================= */
updateSchema.index({ dairy: 1, createdAt: -1 });
updateSchema.index({ type: 1 });

module.exports = mongoose.model('Update', updateSchema);