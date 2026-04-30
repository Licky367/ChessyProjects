// models/Update.js

const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  dairy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dairy',
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  image: {
    type: String,
    default: null
  },

  comment: {
    type: String,
    trim: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Update', updateSchema);