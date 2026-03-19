const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middleware/validators');

// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

// Get current user
router.get('/me', authController.validateToken);

// Cognito routes
router.post('/cognito/signup', validateSignup, authController.cognitoSignup);
router.post('/cognito/login', validateLogin, authController.cognitoLogin);
router.post('/cognito/confirm', authController.cognitoConfirm);
router.post('/cognito/refresh', authController.cognitoRefresh);

// Token validation
router.get('/validate', authController.validateToken);

module.exports = router;
