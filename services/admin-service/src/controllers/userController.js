const User = require('../models/User');
const UserPg = require('../models/UserPg');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

// Get all users with pagination and filters
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, subscription, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (subscription) query['subscription.plan'] = subscription;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -cognitoId')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -cognitoId');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get PostgreSQL data if needed
    const userPg = await UserPg.findOne({ where: { email: user.email } });
    
    res.json({
      ...user.toObject(),
      pgData: userPg ? { transactions: userPg.transactionCount, lastLogin: userPg.lastLogin } : null
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { email, profile, role, status } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { email, profile, role, status, updatedAt: new Date() },
      { new: true }
    ).select('-password -cognitoId');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'USER_UPDATE',
      targetId: user._id,
      targetType: 'User',
      details: { updated: Object.keys(req.body) }
    });

    logger.info(`User ${user._id} updated by admin`);
    res.json(user);
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also delete from PostgreSQL
    await UserPg.destroy({ where: { email: user.email } });

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'USER_DELETE',
      targetId: user._id,
      targetType: 'User',
      details: { email: user.email }
    });

    logger.info(`User ${req.params.id} deleted by admin`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Update user status (active/inactive/suspended)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status, statusReason: reason, statusUpdatedAt: new Date() },
      { new: true }
    ).select('-password -cognitoId');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'USER_STATUS_CHANGE',
      targetId: user._id,
      targetType: 'User',
      details: { status, reason }
    });

    logger.info(`User ${user._id} status changed to ${status}`);
    res.json(user);
  } catch (error) {
    logger.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Update user subscription
exports.updateUserSubscription = async (req, res) => {
  try {
    const { plan, validFrom, validTo, features } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        'subscription.plan': plan,
        'subscription.validFrom': validFrom,
        'subscription.validTo': validTo,
        'subscription.features': features,
        'subscription.updatedAt': new Date()
      },
      { new: true }
    ).select('-password -cognitoId');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await ActivityLog.create({
      adminId: req.user?.id,
      action: 'USER_SUBSCRIPTION_CHANGE',
      targetId: user._id,
      targetType: 'User',
      details: { plan, validFrom, validTo }
    });

    logger.info(`User ${user._id} subscription updated to ${plan}`);
    res.json(user);
  } catch (error) {
    logger.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
};

// Get user activity
exports.getUserActivity = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const activities = await ActivityLog.find({ 
      $or: [
        { targetId: req.params.id },
        { userId: req.params.id }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments({ 
      $or: [
        { targetId: req.params.id },
        { userId: req.params.id }
      ]
    });

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
    logger.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};
