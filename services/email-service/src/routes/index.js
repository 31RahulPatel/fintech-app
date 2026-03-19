const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const subscriptionController = require('../controllers/subscriptionController');

// Email sending endpoints
router.post('/send', emailController.sendEmail);
router.post('/send-scheduled-result', emailController.sendScheduledResult);
router.post('/send-verification', emailController.sendVerificationEmail);
router.post('/send-password-reset', emailController.sendPasswordResetEmail);
router.post('/send-welcome', emailController.sendWelcomeEmail);

// Newsletter/Subscription endpoints
router.post('/subscribe', subscriptionController.subscribe);
router.post('/unsubscribe', subscriptionController.unsubscribe);
router.get('/subscription/status', subscriptionController.getStatus);
router.put('/subscription/preferences', subscriptionController.updatePreferences);

// Admin endpoints
router.post('/broadcast', emailController.broadcastEmail);

module.exports = router;
