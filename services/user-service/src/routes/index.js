const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get current user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile', userController.updateProfile);

// Upload profile image
router.post('/profile/image', userController.uploadProfileImage);

// Delete profile image
router.delete('/profile/image', userController.deleteProfileImage);

// Get user preferences
router.get('/preferences', userController.getPreferences);

// Update user preferences
router.put('/preferences', userController.updatePreferences);

// Get user subscription details
router.get('/subscription', userController.getSubscription);

// Upgrade subscription
router.post('/subscription/upgrade', userController.upgradeSubscription);

// Cancel subscription
router.post('/subscription/cancel', userController.cancelSubscription);

// Get user activity history
router.get('/activity', userController.getActivity);

// Delete account
router.delete('/account', userController.deleteAccount);

module.exports = router;
