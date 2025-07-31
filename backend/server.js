const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/chat', require('./routes/chat'));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 AI Chatbot SaaS Backend is running!',
    features: [
      '✅ User Authentication',
      '✅ Document Upload (PDF/TXT)', 
      '✅ AI Chat with OpenAI'
    ],
    endpoints: [
      'POST /api/auth/register - Register user',
      'POST /api/auth/login - Login user',
      'POST /api/documents/upload - Upload document',
      'GET /api/documents - Get user documents',
      'POST /api/chat - Chat with AI'
    ]
  });
});

// Database connection
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your-mongodb-uri-here') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.log('❌ MongoDB Error:', err.message));
} else {
  console.log('⚠️  Please update MONGODB_URI in .env file');
  console.log('💡 Get your connection string from https://cloud.mongodb.com');
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('🎉 Full-stack AI Chatbot SaaS Backend Ready!');
  console.log('📝 Features: Auth + Document Upload + AI Chat');
  
  if (process.env.OPENAI_API_KEY === 'your-openai-key-here') {
    console.log('⚠️  Remember to add your OpenAI API key to .env file');
  }
});