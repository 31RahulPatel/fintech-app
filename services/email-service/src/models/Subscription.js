const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  userId: String,
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    marketUpdates: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: true },
    productUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false }
  },
  unsubscribedAt: Date,
  source: {
    type: String,
    default: 'website'
  }
}, {
  timestamps: true
});

subscriptionSchema.index({ email: 1 });
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ isActive: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
