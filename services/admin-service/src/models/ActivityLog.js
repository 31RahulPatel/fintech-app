const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_STATUS_CHANGE', 'USER_SUBSCRIPTION_CHANGE',
      'BLOG_CREATE', 'BLOG_UPDATE', 'BLOG_DELETE', 'BLOG_STATUS_CHANGE',
      'COMMENT_CREATE', 'COMMENT_UPDATE', 'COMMENT_DELETE', 'COMMENT_STATUS_CHANGE',
      'NEWS_CREATE', 'NEWS_UPDATE', 'NEWS_DELETE',
      'SETTINGS_UPDATE', 'SUBSCRIPTION_PLANS_UPDATE', 'EMAIL_TEMPLATES_UPDATE',
      'LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'CALCULATOR_USE', 'CHAT_SESSION'
    ]
  },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetType: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ adminId: 1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ targetId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
