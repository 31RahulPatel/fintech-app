const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserPg = require('../models/UserPg');
const cognitoService = require('../services/cognitoService');
const logger = require('../utils/logger');

// Generate JWT tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Signup - now sends OTP instead of logging in immediately
exports.signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but not verified, allow re-signup with new OTP
      if (!existingUser.isVerified) {
        const otp = generateOTP();
        existingUser.otp = otp;
        existingUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        existingUser.password = await bcrypt.hash(password, 12);
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        existingUser.phone = phone;
        await existingUser.save();

        logger.info(`OTP re-sent to unverified user: ${email}, OTP: ${otp}`);

        return res.status(201).json({
          message: 'OTP sent to your email. Please verify to complete registration.',
          requiresVerification: true,
          email
        });
      }
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = generateOTP();

    // Create user in MongoDB (unverified)
    const mongoUser = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: 'user',
      isVerified: false,
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 min
    });

    // Try to create in PostgreSQL (non-blocking)
    try {
      await UserPg.create({
        mongoId: mongoUser._id.toString(),
        email,
        firstName,
        lastName,
        phone,
        role: 'user',
        subscriptionType: 'free',
        isActive: true
      });
    } catch (pgError) {
      logger.warn(`PostgreSQL user creation skipped: ${pgError.message}`);
    }

    logger.info(`User registered, OTP sent: ${email}, OTP: ${otp}`);

    res.status(201).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      requiresVerification: true,
      email
    });
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate tokens
    const tokens = generateTokens({ id: user._id, email: user.email, role: user.role });

    logger.info(`User verified via OTP: ${email}`);

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    logger.error(`Verify OTP error: ${error.message}`);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    logger.info(`OTP resent to: ${email}, OTP: ${otp}`);

    res.json({ message: 'New OTP sent to your email.' });
  } catch (error) {
    logger.error(`Resend OTP error: ${error.message}`);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens({ id: user._id, email: user.email, role: user.role });

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tokens = generateTokens({ id: user._id, email: user.email, role: user.role });

    res.json(tokens);
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If email exists, reset instructions will be sent' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 3600000);
    await user.save();

    // TODO: Send email with reset link

    logger.info(`Password reset requested for: ${email}`);
    res.json({ message: 'If email exists, reset instructions will be sent' });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.resetToken !== token) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    logger.info(`Password reset successful for: ${user.email}`);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    user.isVerified = true;
    await user.save();

    logger.info(`Email verified for: ${user.email}`);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error(`Email verification error: ${error.message}`);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

// Validate token
exports.validateToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ valid: false, error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
};

// Cognito Signup
exports.cognitoSignup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const result = await cognitoService.signUp(email, password, { firstName, lastName, phone });

    // Also create local user records
    const hashedPassword = await bcrypt.hash(password, 12);
    
    let mongoUser;
    try {
      mongoUser = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        cognitoSub: result.userSub,
        role: 'user',
        isVerified: false
      });
    } catch (mongoErr) {
      if (mongoErr.code === 11000) {
        // Duplicate — update existing record with new cognitoSub
        mongoUser = await User.findOneAndUpdate(
          { email },
          { cognitoSub: result.userSub, password: hashedPassword, firstName, lastName, phone, isVerified: false },
          { new: true }
        );
        logger.warn(`MongoDB duplicate for ${email}, updated existing record`);
      } else {
        throw mongoErr;
      }
    }

    // PostgreSQL creation (non-blocking)
    try {
      await UserPg.create({
        mongoId: mongoUser._id.toString(),
        email,
        firstName,
        lastName,
        phone,
        cognitoSub: result.userSub,
        role: 'user',
        subscriptionType: 'free',
        isActive: true
      });
    } catch (pgError) {
      logger.warn(`PostgreSQL user creation skipped: ${pgError.message}`);
    }

    logger.info(`Cognito user registered: ${email}`);

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      requiresVerification: true,
      email,
      userConfirmed: result.userConfirmed,
      userSub: result.userSub
    });
  } catch (error) {
    logger.error(`Cognito signup error: ${error.message}`);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

// Cognito Login
exports.cognitoLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await cognitoService.signIn(email, password);

    // Update local user last login and get user data
    const user = await User.findOneAndUpdate(
      { email },
      { lastLogin: new Date() },
      { new: true }
    );

    logger.info(`Cognito user logged in: ${email}`);

    // Return local JWT tokens + user data for consistency
    const tokens = generateTokens({ id: user._id, email: user.email, role: user.role });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens,
      // Include Cognito ID token for AWS API Gateway
      idToken: result.idToken
    });
  } catch (error) {
    logger.error(`Cognito login error: ${error.message}`);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
};

// Cognito Confirm
exports.cognitoConfirm = async (req, res) => {
  try {
    const { email, code } = req.body;

    await cognitoService.confirmSignUp(email, code);

    // Update local user as verified and get user data
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ error: 'User not found locally' });
    }

    // Generate local JWT tokens so user is logged in after confirmation
    const tokens = generateTokens({ id: user._id, email: user.email, role: user.role });

    logger.info(`Cognito user confirmed: ${email}`);

    res.json({
      message: 'Email confirmed successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    logger.error(`Cognito confirm error: ${error.message}`);
    res.status(400).json({ error: error.message || 'Confirmation failed' });
  }
};

// Cognito Refresh
exports.cognitoRefresh = async (req, res) => {
  try {
    const { refreshToken, email } = req.body;

    const result = await cognitoService.refreshSession(email, refreshToken);

    res.json({
      accessToken: result.accessToken,
      idToken: result.idToken
    });
  } catch (error) {
    logger.error(`Cognito refresh error: ${error.message}`);
    res.status(401).json({ error: error.message || 'Token refresh failed' });
  }
};
