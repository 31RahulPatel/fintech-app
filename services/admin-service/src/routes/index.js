const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const contentController = require('../controllers/contentController');
const analyticsController = require('../controllers/analyticsController');
const settingsController = require('../controllers/settingsController');

// User Management Routes
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.put('/users/:id/status', userController.updateUserStatus);
router.put('/users/:id/subscription', userController.updateUserSubscription);
router.get('/users/:id/activity', userController.getUserActivity);

// Content Management Routes
router.get('/blogs', contentController.getAllBlogs);
router.put('/blogs/:id/status', contentController.updateBlogStatus);
router.delete('/blogs/:id', contentController.deleteBlog);
router.get('/comments', contentController.getAllComments);
router.put('/comments/:id/status', contentController.updateCommentStatus);
router.delete('/comments/:id', contentController.deleteComment);
router.get('/news', contentController.getAllNews);
router.post('/news', contentController.createNews);
router.put('/news/:id', contentController.updateNews);
router.delete('/news/:id', contentController.deleteNews);

// Analytics Routes
router.get('/analytics/dashboard', analyticsController.getDashboardStats);
router.get('/analytics/users', analyticsController.getUserAnalytics);
router.get('/analytics/revenue', analyticsController.getRevenueAnalytics);
router.get('/analytics/content', analyticsController.getContentAnalytics);
router.get('/analytics/calculators', analyticsController.getCalculatorUsage);
router.get('/analytics/chatbot', analyticsController.getChatbotAnalytics);

// Settings Routes
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);
router.get('/settings/subscription-plans', settingsController.getSubscriptionPlans);
router.put('/settings/subscription-plans', settingsController.updateSubscriptionPlans);
router.get('/settings/email-templates', settingsController.getEmailTemplates);
router.put('/settings/email-templates', settingsController.updateEmailTemplates);

module.exports = router;
