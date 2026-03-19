const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'profile_update',
      'profile_image_upload',
      'password_change',
      'subscription_upgrade',
      'subscription_cancel',
      'calculator_use',
      'market_search',
      'news_read',
      'blog_read',
      'chatbot_prompt',
      'email_subscribe',
      'email_unsubscribe'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ action: 1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
