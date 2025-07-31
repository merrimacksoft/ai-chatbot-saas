const express = require('express');
const auth = require('../middleware/auth');
const Contact = require('../models/Contact');
const router = express.Router();

// Submit contact information for callback
router.post('/callback', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      question,
      interest,
      bestTimeToCall,
      timezone,
      conversationId,
      chatbotId
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !question) {
      return res.status(400).json({
        error: 'Name, email, phone, and question are required'
      });
    }

    // Check if contact already exists for this conversation
    const existingContact = await Contact.findOne({
      userId: req.userId,
      email: email.toLowerCase(),
      conversationId
    });

    if (existingContact) {
      return res.status(400).json({
        error: 'Contact information already submitted for this conversation'
      });
    }

    // Determine priority based on interest
    let priority = 'medium';
    if (interest === 'pricing' || interest === 'demo') {
      priority = 'high';
    } else if (interest === 'technical') {
      priority = 'medium';
    }

    const contact = new Contact({
      userId: req.userId,
      chatbotId,
      conversationId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      company: company?.trim(),
      question: question.trim(),
      interest,
      bestTimeToCall,
      timezone,
      priority
    });

    await contact.save();

    console.log(`📞 New callback request from ${contact.name} (${contact.email})`);

    // TODO: Send notification email to sales team
    // TODO: Add to CRM system
    // TODO: Send confirmation email to user

    res.status(201).json({
      message: 'Thank you! We\'ll contact you within 24 hours.',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        estimatedCallTime: getEstimatedCallTime(bestTimeToCall, timezone)
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Failed to submit contact information' });
  }
});

// Get user's contact submissions
router.get('/my-requests', auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.userId })
      .select('-userId')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ contacts });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to get contact requests' });
  }
});

// Get all contact requests (admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    // TODO: Add admin permission check
    
    const { status, priority, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const contacts = await Contact.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

// Update contact status (admin only)
router.patch('/admin/:id/status', auth, async (req, res) => {
  try {
    // TODO: Add admin permission check
    
    const { status, notes } = req.body;
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        notes,
        contactedAt: status === 'contacted' ? new Date() : undefined
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact });

  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({ error: 'Failed to update contact status' });
  }
});

// Helper function to estimate call time
function getEstimatedCallTime(bestTime, timezone) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  let callTime;
  switch (bestTime) {
    case 'morning':
      callTime = new Date(tomorrow.setHours(9, 0, 0, 0));
      break;
    case 'afternoon':
      callTime = new Date(tomorrow.setHours(14, 0, 0, 0));
      break;
    case 'evening':
      callTime = new Date(tomorrow.setHours(18, 0, 0, 0));
      break;
    default:
      callTime = new Date(tomorrow.setHours(10, 0, 0, 0));
  }
  
  return callTime.toISOString();
}

module.exports = router;