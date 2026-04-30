// models/Update.js

const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({

  // Which dairy this update belongs to
  dairy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dairy',
    required: true,
    index: true
  },

  // Who made the update
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Image snapshot (NEW image when changed)
  image: {
    type: String,
    default: null
  },

  // Optional comment (FB-style caption or comment)
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Type of update (important for filtering later)
  type: {
    type: String,
    enum: ['image', 'comment'],
    required: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Update', updateSchema);