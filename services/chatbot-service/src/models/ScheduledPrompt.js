const mongoose = require('mongoose');

const scheduledPromptSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  time: {
    type: String,
    default: '09:00'
  },
  days: [{
    type: String,
    enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  }],
  endDate: {
    type: Date
  },
  emailResults: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRun: {
    type: Date
  },
  runCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

scheduledPromptSchema.index({ userId: 1 });
scheduledPromptSchema.index({ isActive: 1 });

module.exports = mongoose.model('ScheduledPrompt', scheduledPromptSchema);
