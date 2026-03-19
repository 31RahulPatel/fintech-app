const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true
  },
  subject: String,
  type: {
    type: String,
    enum: ['generic', 'verification', 'password_reset', 'welcome', 'scheduled_result', 'newsletter', 'marketing'],
    default: 'generic'
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'bounced', 'delivered'],
    default: 'sent'
  },
  messageId: String,
  error: String
}, {
  timestamps: true
});

emailLogSchema.index({ to: 1 });
emailLogSchema.index({ type: 1 });
emailLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
