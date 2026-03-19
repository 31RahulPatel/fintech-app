const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const logger = require('../utils/logger');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { firstName, lastName, phone, bio, location, website } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        firstName, 
        lastName, 
        phone, 
        bio, 
        location, 
        website,
        updatedAt: new Date() 
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log activity
    await UserActivity.create({
      userId,
      action: 'profile_update',
      details: { fields: Object.keys(req.body) }
    });

    logger.info(`Profile updated for user: ${userId}`);
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    // In production, integrate with S3
    const imageUrl = req.body.imageUrl || 'default-avatar.png';

    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await UserActivity.create({
      userId,
      action: 'profile_image_upload',
      details: { imageUrl }
    });

    logger.info(`Profile image uploaded for user: ${userId}`);
    res.json({ message: 'Profile image uploaded', user });
  } catch (error) {
    logger.error(`Upload profile image error: ${error.message}`);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

// Delete profile image
exports.deleteProfileImage = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: null },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Profile image deleted for user: ${userId}`);
    res.json({ message: 'Profile image deleted', user });
  } catch (error) {
    logger.error(`Delete profile image error: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

// Get user preferences
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const user = await User.findById(userId).select('preferences');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ preferences: user.preferences });
  } catch (error) {
    logger.error(`Get preferences error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { notifications, newsletter, theme } = req.body;

    const updateData = {};
    if (notifications) updateData['preferences.notifications'] = notifications;
    if (typeof newsletter === 'boolean') updateData['preferences.newsletter'] = newsletter;
    if (theme) updateData['preferences.theme'] = theme;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('preferences');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Preferences updated for user: ${userId}`);
    res.json({ message: 'Preferences updated', preferences: user.preferences });
  } catch (error) {
    logger.error(`Update preferences error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Get user subscription
exports.getSubscription = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const user = await User.findById(userId).select('role subscription');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      subscription: {
        type: user.role,
        ...user.subscription
      }
    });
  } catch (error) {
    logger.error(`Get subscription error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
};

// Upgrade subscription
exports.upgradeSubscription = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { plan } = req.body;

    if (!['premium', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        role: plan,
        subscription: {
          type: plan,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          isActive: true
        }
      },
      { new: true }
    ).select('role subscription');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await UserActivity.create({
      userId,
      action: 'subscription_upgrade',
      details: { plan }
    });

    logger.info(`Subscription upgraded for user: ${userId} to ${plan}`);
    res.json({ message: 'Subscription upgraded', subscription: user.subscription });
  } catch (error) {
    logger.error(`Upgrade subscription error: ${error.message}`);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        role: 'user',
        'subscription.isActive': false,
        'subscription.cancelledAt': new Date()
      },
      { new: true }
    ).select('role subscription');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await UserActivity.create({
      userId,
      action: 'subscription_cancel',
      details: {}
    });

    logger.info(`Subscription cancelled for user: ${userId}`);
    res.json({ message: 'Subscription cancelled' });
  } catch (error) {
    logger.error(`Cancel subscription error: ${error.message}`);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Get user activity
exports.getActivity = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { page = 1, limit = 20 } = req.query;

    const activities = await UserActivity.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await UserActivity.countDocuments({ userId });

    res.json({ 
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Get activity error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get activity' });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    // Soft delete - mark as inactive
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isActive: false,
        deletedAt: new Date(),
        email: `deleted_${userId}@deleted.com`
      }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Account deleted for user: ${userId}`);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error(`Delete account error: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
