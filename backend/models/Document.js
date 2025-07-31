const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'txt'],
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);