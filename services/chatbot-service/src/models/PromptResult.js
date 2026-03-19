const mongoose = require('mongoose');

const promptResultSchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledPrompt',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  error: {
    type: Boolean,
    default: false
  },
  executedAt: {
    type: Date,
    default: Date.now
  },
  emailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

promptResultSchema.index({ scheduleId: 1, createdAt: -1 });
promptResultSchema.index({ userId: 1 });

module.exports = mongoose.model('PromptResult', promptResultSchema);
