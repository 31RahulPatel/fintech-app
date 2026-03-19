const User = require('../models/User');
const Blog = require('../models/Blog');
const News = require('../models/News');
const Comment = require('../models/Comment');
const CalculatorUsage = require('../models/CalculatorUsage');
const ChatSession = require('../models/ChatSession');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const premiumUsers = await User.countDocuments({ 'subscription.plan': 'premium' });
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thisMonth } });
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth, $lt: thisMonth }
    });

    // Content stats
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ status: 'published' });
    const totalNews = await News.countDocuments();
    const totalComments = await Comment.countDocuments();

    // Calculator usage
    const calculatorUsageToday = await CalculatorUsage.countDocuments({ createdAt: { $gte: today } });

    // Chatbot stats
    const chatSessionsToday = await ChatSession.countDocuments({ updatedAt: { $gte: today } });

    // Recent activity
    const recentActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10);

    // Growth calculations
    const userGrowth = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
      : 100;

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        premium: premiumUsers,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
        growth: parseFloat(userGrowth)
      },
      content: {
        blogs: {
          total: totalBlogs,
          published: publishedBlogs
        },
        news: totalNews,
        comments: totalComments
      },
      engagement: {
        calculatorUsageToday,
        chatSessionsToday
      },
      recentActivity
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get user analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // User signups over time
    const signupsByDay = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Subscription distribution
    const subscriptionDistribution = await User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ]);

    // User status distribution
    const statusDistribution = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top active users (by activity count)
    const topActiveUsers = await ActivityLog.aggregate([
      { $match: { userId: { $exists: true }, createdAt: { $gte: startDate } } },
      { $group: { _id: '$userId', activityCount: { $sum: 1 } } },
      { $sort: { activityCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      period,
      signupsByDay,
      subscriptionDistribution,
      statusDistribution,
      topActiveUsers
    });
  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
};

// Get revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Premium subscription upgrades
    const subscriptionUpgrades = await ActivityLog.countDocuments({
      action: 'USER_SUBSCRIPTION_CHANGE',
      'details.plan': 'premium',
      createdAt: { $gte: startDate }
    });

    // Revenue estimation (mock data for now)
    const premiumMonthlyPrice = 499;
    const premiumYearlyPrice = 4999;
    
    const monthlySubscribers = await User.countDocuments({
      'subscription.plan': 'premium',
      'subscription.billingCycle': 'monthly'
    });
    
    const yearlySubscribers = await User.countDocuments({
      'subscription.plan': 'premium',
      'subscription.billingCycle': 'yearly'
    });

    const estimatedMRR = (monthlySubscribers * premiumMonthlyPrice) + (yearlySubscribers * premiumYearlyPrice / 12);
    const estimatedARR = estimatedMRR * 12;

    // Revenue by day (mock)
    const revenueByDay = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      revenueByDay.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 1000
      });
    }

    res.json({
      period,
      subscriptions: {
        monthly: monthlySubscribers,
        yearly: yearlySubscribers,
        recentUpgrades: subscriptionUpgrades
      },
      revenue: {
        mrr: estimatedMRR,
        arr: estimatedARR,
        byDay: revenueByDay
      }
    });
  } catch (error) {
    logger.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
};

// Get content analytics
exports.getContentAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Blog stats
    const newBlogs = await Blog.countDocuments({ createdAt: { $gte: startDate } });
    const topBlogs = await Blog.find()
      .sort({ views: -1 })
      .limit(10)
      .select('title views likes category createdAt');

    // Blog categories distribution
    const blogsByCategory = await Blog.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      }
    ]);

    // Comments stats
    const newComments = await Comment.countDocuments({ createdAt: { $gte: startDate } });
    const commentsByStatus = await Comment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // News stats
    const newNews = await News.countDocuments({ createdAt: { $gte: startDate } });
    const newsByCategory = await News.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      period,
      blogs: {
        new: newBlogs,
        top: topBlogs,
        byCategory: blogsByCategory
      },
      comments: {
        new: newComments,
        byStatus: commentsByStatus
      },
      news: {
        new: newNews,
        byCategory: newsByCategory
      }
    });
  } catch (error) {
    logger.error('Error fetching content analytics:', error);
    res.status(500).json({ error: 'Failed to fetch content analytics' });
  }
};

// Get calculator usage analytics
exports.getCalculatorUsage = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Usage by calculator type
    const usageByType = await CalculatorUsage.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$calculatorType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Usage over time
    const usageByDay = await CalculatorUsage.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Free vs Premium calculator usage
    const premiumCalculators = ['EMI', 'FD', 'RD', 'PPF', 'NPS', 'EPF', 'Gratuity', 'Inflation', 'Retirement', 'HomeLoan', 'CarLoan', 'PersonalLoan', 'EducationLoan', 'SWP', 'GoalPlanning', 'CAGR', 'Tax'];
    
    const freeUsage = await CalculatorUsage.countDocuments({
      createdAt: { $gte: startDate },
      calculatorType: { $nin: premiumCalculators }
    });
    
    const premiumUsage = await CalculatorUsage.countDocuments({
      createdAt: { $gte: startDate },
      calculatorType: { $in: premiumCalculators }
    });

    res.json({
      period,
      usage: {
        total: freeUsage + premiumUsage,
        free: freeUsage,
        premium: premiumUsage,
        byType: usageByType,
        byDay: usageByDay
      }
    });
  } catch (error) {
    logger.error('Error fetching calculator usage:', error);
    res.status(500).json({ error: 'Failed to fetch calculator usage' });
  }
};

// Get chatbot analytics
exports.getChatbotAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Total sessions
    const totalSessions = await ChatSession.countDocuments({ createdAt: { $gte: startDate } });

    // Sessions by day
    const sessionsByDay = await ChatSession.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Average messages per session
    const avgMessagesResult = await ChatSession.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $project: {
          messageCount: { $size: '$messages' }
        }
      },
      {
        $group: {
          _id: null,
          avgMessages: { $avg: '$messageCount' }
        }
      }
    ]);
    const avgMessages = avgMessagesResult[0]?.avgMessages || 0;

    // Most active users in chatbot
    const topChatbotUsers = await ChatSession.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$userId', sessionCount: { $sum: 1 } } },
      { $sort: { sessionCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      period,
      chatbot: {
        totalSessions,
        sessionsByDay,
        avgMessagesPerSession: avgMessages.toFixed(1),
        topUsers: topChatbotUsers
      }
    });
  } catch (error) {
    logger.error('Error fetching chatbot analytics:', error);
    res.status(500).json({ error: 'Failed to fetch chatbot analytics' });
  }
};
