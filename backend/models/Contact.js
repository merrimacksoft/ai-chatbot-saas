const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  
  // Contact Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  
  // Callback Preferences
  bestTimeToCall: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'anytime'],
    default: 'anytime'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Context
  question: {
    type: String,
    required: true
  },
  interest: {
    type: String,
    enum: ['pricing', 'demo', 'technical', 'general', 'other'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Status
  status: {
    type: String,
    enum: ['new', 'contacted', 'scheduled', 'completed', 'no_response'],
    default: 'new'
  },
  notes: {
    type: String
  },
  contactedAt: Date,
  scheduledAt: Date
}, {
  timestamps: true
});

// Index for searching and sorting
contactSchema.index({ userId: 1, status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ email: 1 });

module.exports = mongoose.model('Contact', contactSchema);