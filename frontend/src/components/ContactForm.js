import React, { useState } from 'react';
import axios from 'axios';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const ContactForm = ({ 
  isOpen, 
  onClose, 
  reason, 
  suggestion, 
  conversationId, 
  chatbotId,
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    question: '',
    interest: getDefaultInterest(reason),
    bestTimeToCall: 'anytime',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/contacts/callback', {
        ...formData,
        conversationId,
        chatbotId
      }, getAuthHeader());

      onSuccess(response.data);
      onClose();
      
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="contact-overlay">
      <div className="contact-modal">
        <div className="contact-header">
          <h3>📞 Request a Callback</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="contact-body">
          <p className="contact-suggestion">{suggestion}</p>
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company name (optional)"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>What can we help you with? *</label>
              <textarea
                name="question"
                value={formData.question}
                onChange={handleChange}
                required
                placeholder="Describe what you'd like to discuss..."
                rows="3"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Interest</label>
                <select
                  name="interest"
                  value={formData.interest}
                  onChange={handleChange}
                >
                  <option value="general">General Inquiry</option>
                  <option value="pricing">Pricing Information</option>
                  <option value="demo">Product Demo</option>
                  <option value="technical">Technical Questions</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Best Time to Call</label>
                <select
                  name="bestTimeToCall"
                  value={formData.bestTimeToCall}
                  onChange={handleChange}
                >
                  <option value="anytime">Anytime</option>
                  <option value="morning">Morning (9AM-12PM)</option>
                  <option value="afternoon">Afternoon (12PM-5PM)</option>
                  <option value="evening">Evening (5PM-8PM)</option>
                </select>
              </div>
            </div>
            
            <div className="contact-footer">
              <button 
                type="button" 
                onClick={onClose} 
                className="cancel-button"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Request Callback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine default interest based on trigger reason
function getDefaultInterest(reason) {
  const mapping = {
    pricing_inquiry: 'pricing',
    demo_request: 'demo',
    technical_issue: 'technical',
    high_intent: 'pricing'
  };
  
  return mapping[reason] || 'general';
}

export default ContactForm;