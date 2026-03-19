const Subscription = require('../models/Subscription');
const logger = require('../utils/logger');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email, preferences = {} } = req.body;
    const userId = req.headers['x-user-id'];

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let subscription = await Subscription.findOne({ email });

    if (subscription) {
      if (subscription.isActive) {
        return res.status(400).json({ error: 'Email already subscribed' });
      }
      // Reactivate subscription
      subscription.isActive = true;
      subscription.userId = userId;
      subscription.preferences = {
        ...subscription.preferences,
        ...preferences
      };
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        email,
        userId,
        isActive: true,
        preferences: {
          marketUpdates: true,
          newsletter: true,
          productUpdates: true,
          promotions: false,
          ...preferences
        }
      });
    }

    logger.info(`Email subscribed: ${email}`);
    res.status(201).json({ 
      message: 'Successfully subscribed',
      subscription: {
        email: subscription.email,
        preferences: subscription.preferences
      }
    });
  } catch (error) {
    logger.error(`Subscribe error: ${error.message}`);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const subscription = await Subscription.findOne({ email });

    if (!subscription) {
      return res.status(404).json({ error: 'Email not found in subscriptions' });
    }

    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    logger.info(`Email unsubscribed: ${email}`);
    res.json({ message: 'Successfully unsubscribed' });
  } catch (error) {
    logger.error(`Unsubscribe error: ${error.message}`);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};

// Get subscription status
exports.getStatus = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];

    if (!userId && !userEmail) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const query = userId ? { userId } : { email: userEmail };
    const subscription = await Subscription.findOne(query);

    if (!subscription) {
      return res.json({ 
        subscribed: false,
        preferences: null
      });
    }

    res.json({
      subscribed: subscription.isActive,
      preferences: subscription.preferences,
      subscribedAt: subscription.createdAt
    });
  } catch (error) {
    logger.error(`Get status error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};

// Update subscription preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { preferences } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Preferences object required' });
    }

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    subscription.preferences = {
      ...subscription.preferences,
      ...preferences
    };
    await subscription.save();

    logger.info(`Preferences updated for user: ${userId}`);
    res.json({ 
      message: 'Preferences updated',
      preferences: subscription.preferences
    });
  } catch (error) {
    logger.error(`Update preferences error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};
