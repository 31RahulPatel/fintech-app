const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  siteName: String,
  siteDescription: String,
  contactEmail: String,
  socialLinks: {
    twitter: String,
    linkedin: String,
    facebook: String
  },
  maintenance: {
    enabled: Boolean,
    message: String
  },
  features: {
    calculators: Boolean,
    marketData: Boolean,
    news: Boolean,
    blog: Boolean,
    chatbot: Boolean,
    emailSubscription: Boolean
  },
  limits: {
    freeCalculatorsPerDay: Number,
    freeChatMessagesPerDay: Number,
    maxWatchlistItems: Number,
    maxBookmarks: Number
  },
  plans: mongoose.Schema.Types.Mixed,
  templates: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
