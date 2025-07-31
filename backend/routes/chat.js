const express = require('express');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const { generateResponse } = require('../services/openai');
const router = express.Router();

// Keywords that indicate user needs human help
const CONTACT_TRIGGER_KEYWORDS = [
  'pricing', 'price', 'cost', 'how much', 'quote', 'estimate',
  'demo', 'demonstration', 'show me', 'trial',
  'speak to someone', 'human', 'representative', 'sales',
  'call me', 'phone', 'contact',
  'business plan', 'enterprise', 'custom',
  'integration', 'setup help', 'implementation'
];

const HIGH_INTENT_KEYWORDS = [
  'buy', 'purchase', 'subscribe', 'upgrade',
  'when can we start', 'how do we begin',
  'what\'s the next step', 'ready to proceed'
];

// Chat with AI
router.post('/', auth, async (req, res) => {
  try {
    const { question, conversationLength = 0 } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Get user's documents
    const documents = await Document.find({ userId: req.userId });

    if (documents.length === 0) {
      return res.json({
        answer: "You haven't uploaded any documents yet. Please upload some documents first so I can answer your questions!",
        shouldShowContact: false
      });
    }

    console.log(`💬 Chat request from user ${req.userId}: "${question}"`);

    // Generate AI response
    const answer = await generateResponse(question, documents);

    // Determine if we should show contact form
    const shouldShowContact = shouldOfferContact(question, answer, conversationLength);
    const contactReason = getContactReason(question, answer, conversationLength);

    console.log(`🤖 AI response generated for user ${req.userId}`);
    if (shouldShowContact) {
      console.log(`📞 Contact form triggered: ${contactReason}`);
    }

    res.json({
      question,
      answer,
      documentsUsed: documents.length,
      shouldShowContact,
      contactReason,
      contactSuggestion: shouldShowContact ? getContactSuggestion(contactReason) : null
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact administrator.',
        shouldShowContact: true,
        contactReason: 'technical_issue'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate response',
      shouldShowContact: true,
      contactReason: 'technical_issue'
    });
  }
});

// Determine if contact form should be shown
function shouldOfferContact(question, answer, conversationLength) {
  const questionLower = question.toLowerCase();
  
  // High intent keywords - always show
  if (HIGH_INTENT_KEYWORDS.some(keyword => questionLower.includes(keyword))) {
    return true;
  }
  
  // Contact trigger keywords
  if (CONTACT_TRIGGER_KEYWORDS.some(keyword => questionLower.includes(keyword))) {
    return true;
  }
  
  // AI couldn't provide a complete answer
  if (answer.includes("I don't have that information") || 
      answer.includes("I don't know") ||
      answer.includes("contact") ||
      answer.includes("speak to")) {
    return true;
  }
  
  // Long conversation - offer human help
  if (conversationLength >= 5) {
    return true;
  }
  
  return false;
}

// Get reason for showing contact form
function getContactReason(question, answer, conversationLength) {
  const questionLower = question.toLowerCase();
  
  if (HIGH_INTENT_KEYWORDS.some(keyword => questionLower.includes(keyword))) {
    return 'high_intent';
  }
  
  if (questionLower.includes('pricing') || questionLower.includes('cost')) {
    return 'pricing_inquiry';
  }
  
  if (questionLower.includes('demo') || questionLower.includes('trial')) {
    return 'demo_request';
  }
  
  if (answer.includes("I don't have that information")) {
    return 'incomplete_answer';
  }
  
  if (conversationLength >= 5) {
    return 'long_conversation';
  }
  
  return 'general_inquiry';
}

// Get personalized contact suggestion
function getContactSuggestion(reason) {
  const suggestions = {
    high_intent: "It sounds like you're ready to move forward! Let's schedule a call to discuss your specific needs.",
    pricing_inquiry: "I'd be happy to provide detailed pricing information. Let's schedule a quick call to discuss your requirements.",
    demo_request: "I can arrange a personalized demo for you. When would be a good time for a call?",
    incomplete_answer: "I don't have all the details you need. Let me connect you with someone who can help.",
    long_conversation: "You've asked some great questions! Would you like to speak with someone directly?",
    technical_issue: "I'm experiencing some technical difficulties. Let me have someone contact you to help.",
    general_inquiry: "Would you like to speak with someone who can provide more detailed information?"
  };
  
  return suggestions[reason] || suggestions.general_inquiry;
}

module.exports = router;