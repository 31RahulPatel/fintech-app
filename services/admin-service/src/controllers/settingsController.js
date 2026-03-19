const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

// Default settings
const defaultSettings = {
  siteName: 'FintechOps',
  siteDescription: 'Your trusted financial companion',
  contactEmail: 'support@fintechops.com',
  socialLinks: {
    twitter: '',
    linkedin: '',
    facebook: ''
  },
  maintenance: {
    enabled: false,
    message: 'We are currently performing maintenance. Please check back soon.'
  },
  features: {
    calculators: true,
    marketData: true,
    news: true,
    blog: true,
    chatbot: true,
    emailSubscription: true
  },
  limits: {
    freeCalculatorsPerDay: 10,
    freeChatMessagesPerDay: 20,
    maxWatchlistItems: 50,
    maxBookmarks: 100
  }
};

// Default subscription plans
const defaultSubscriptionPlans = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      '3 Basic Calculators',
      'Limited Market Data',
      'News Access',
      'Blog Access',
      '10 Chat Messages/Day'
    ],
    limits: {
      calculators: ['SIP', 'CompoundInterest', 'Lumpsum'],
      chatMessagesPerDay: 10,
      marketDataDelay: 15
    }
  },
  premium: {
    name: 'Premium',
    monthlyPrice: 499,
    yearlyPrice: 4999,
    features: [
      'All 20 Financial Calculators',
      'Real-time Market Data',
      'ProStocks Access',
      'Unlimited News & Blogs',
      'Unlimited Chat Messages',
      'Scheduled Prompts',
      'Email Notifications',
      'Priority Support'
    ],
    limits: {
      calculators: 'all',
      chatMessagesPerDay: -1,
      marketDataDelay: 0
    }
  }
};

// Default email templates
const defaultEmailTemplates = {
  welcome: {
    subject: 'Welcome to FintechOps!',
    body: 'Hello {{name}},\n\nWelcome to FintechOps! We are excited to have you on board.\n\nStart exploring our financial tools and market insights today.\n\nBest regards,\nFintechOps Team'
  },
  passwordReset: {
    subject: 'Reset Your Password - FintechOps',
    body: 'Hello {{name}},\n\nWe received a request to reset your password. Click the link below to set a new password:\n\n{{resetLink}}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nFintechOps Team'
  },
  subscriptionUpgrade: {
    subject: 'Welcome to Premium - FintechOps',
    body: 'Hello {{name}},\n\nThank you for upgrading to Premium! You now have access to all our premium features.\n\nEnjoy unlimited calculators, real-time market data, and more.\n\nBest regards,\nFintechOps Team'
  },
  scheduledPromptResult: {
    subject: 'Your Scheduled Prompt Results - Bazar.ai',
    body: 'Hello {{name}},\n\nHere are the results of your scheduled prompt:\n\n{{promptTitle}}\n\n{{results}}\n\nBest regards,\nBazar.ai by FintechOps'
  },
  newsletter: {
    subject: 'FintechOps Weekly Digest',
    body: 'Hello {{name}},\n\nHere is your weekly digest of financial news and market insights.\n\n{{content}}\n\nBest regards,\nFintechOps Team'
  }
};

// Get settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'general' });
    
    if (!settings) {
      settings = await Settings.create({
        type: 'general',
        ...defaultSettings
      });
    }

    res.json(settings);
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { type: 'general' },
      { ...req.body, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'SETTINGS_UPDATE',
      targetType: 'Settings',
      details: { updated: Object.keys(req.body) }
    });

    logger.info('Settings updated');
    res.json(settings);
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Get subscription plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    let plans = await Settings.findOne({ type: 'subscriptionPlans' });
    
    if (!plans) {
      plans = await Settings.create({
        type: 'subscriptionPlans',
        plans: defaultSubscriptionPlans
      });
    }

    res.json(plans.plans || defaultSubscriptionPlans);
  } catch (error) {
    logger.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
};

// Update subscription plans
exports.updateSubscriptionPlans = async (req, res) => {
  try {
    const plans = await Settings.findOneAndUpdate(
      { type: 'subscriptionPlans' },
      { plans: req.body, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'SUBSCRIPTION_PLANS_UPDATE',
      targetType: 'Settings',
      details: { plans: Object.keys(req.body) }
    });

    logger.info('Subscription plans updated');
    res.json(plans.plans);
  } catch (error) {
    logger.error('Error updating subscription plans:', error);
    res.status(500).json({ error: 'Failed to update subscription plans' });
  }
};

// Get email templates
exports.getEmailTemplates = async (req, res) => {
  try {
    let templates = await Settings.findOne({ type: 'emailTemplates' });
    
    if (!templates) {
      templates = await Settings.create({
        type: 'emailTemplates',
        templates: defaultEmailTemplates
      });
    }

    res.json(templates.templates || defaultEmailTemplates);
  } catch (error) {
    logger.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
};

// Update email templates
exports.updateEmailTemplates = async (req, res) => {
  try {
    const templates = await Settings.findOneAndUpdate(
      { type: 'emailTemplates' },
      { templates: req.body, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'EMAIL_TEMPLATES_UPDATE',
      targetType: 'Settings',
      details: { templates: Object.keys(req.body) }
    });

    logger.info('Email templates updated');
    res.json(templates.templates);
  } catch (error) {
    logger.error('Error updating email templates:', error);
    res.status(500).json({ error: 'Failed to update email templates' });
  }
};
