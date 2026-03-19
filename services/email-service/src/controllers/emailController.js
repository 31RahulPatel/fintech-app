const awsService = require('../services/awsService');
const EmailLog = require('../models/EmailLog');
const logger = require('../utils/logger');

// Send generic email
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, body, html } = req.body;

    if (!to || !subject || (!body && !html)) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body/html' });
    }

    const result = await awsService.sendEmail({
      to,
      subject,
      body,
      html
    });

    // Log email
    await EmailLog.create({
      to,
      subject,
      type: 'generic',
      status: 'sent',
      messageId: result.MessageId
    });

    logger.info(`Email sent to: ${to}`);
    res.json({ message: 'Email sent successfully', messageId: result.MessageId });
  } catch (error) {
    logger.error(`Send email error: ${error.message}`);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

// Send scheduled prompt result
exports.sendScheduledResult = async (req, res) => {
  try {
    const { to, subject, prompt, response } = req.body;

    if (!to || !prompt || !response) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fb8500; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .prompt { background: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .response { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #fb8500; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bazar.ai - Scheduled Response</h1>
          </div>
          <div class="content">
            <h3>Your Scheduled Prompt:</h3>
            <div class="prompt">${prompt}</div>
            
            <h3>AI Response:</h3>
            <div class="response">${response.replace(/\n/g, '<br>')}</div>
          </div>
          <div class="footer">
            <p>This is an automated message from FintechOps - Bazar.ai</p>
            <p>You can manage your scheduled prompts in your dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await awsService.sendEmail({
      to,
      subject: subject || 'Bazar.ai Scheduled Response',
      html
    });

    await EmailLog.create({
      to,
      subject,
      type: 'scheduled_result',
      status: 'sent',
      messageId: result.MessageId
    });

    logger.info(`Scheduled result email sent to: ${to}`);
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    logger.error(`Send scheduled result error: ${error.message}`);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

// Send verification email
exports.sendVerificationEmail = async (req, res) => {
  try {
    const { to, name, verificationLink } = req.body;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fb8500; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; text-align: center; }
          .button { display: inline-block; background: #fb8500; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FintechOps</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email</h2>
            <p>Hi ${name || 'User'},</p>
            <p>Thank you for signing up! Please verify your email address to get started.</p>
            <a href="${verificationLink}" class="button">Verify Email</a>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 FintechOps. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await awsService.sendEmail({
      to,
      subject: 'Verify your FintechOps account',
      html
    });

    await EmailLog.create({
      to,
      subject: 'Email Verification',
      type: 'verification',
      status: 'sent',
      messageId: result.MessageId
    });

    logger.info(`Verification email sent to: ${to}`);
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    logger.error(`Send verification email error: ${error.message}`);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (req, res) => {
  try {
    const { to, name, resetLink } = req.body;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fb8500; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; text-align: center; }
          .button { display: inline-block; background: #fb8500; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FintechOps</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi ${name || 'User'},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 FintechOps. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await awsService.sendEmail({
      to,
      subject: 'Reset your FintechOps password',
      html
    });

    await EmailLog.create({
      to,
      subject: 'Password Reset',
      type: 'password_reset',
      status: 'sent',
      messageId: result.MessageId
    });

    logger.info(`Password reset email sent to: ${to}`);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    logger.error(`Send password reset email error: ${error.message}`);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (req, res) => {
  try {
    const { to, name } = req.body;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fb8500; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .feature { padding: 15px; margin: 10px 0; background: white; border-radius: 5px; }
          .button { display: inline-block; background: #fb8500; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to FintechOps!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name || 'User'},</h2>
            <p>Welcome aboard! We're excited to have you join FintechOps.</p>
            
            <h3>Here's what you can do:</h3>
            <div class="feature">📊 <strong>Market Data</strong> - Track real-time stock prices and market trends</div>
            <div class="feature">🧮 <strong>Calculators</strong> - Use 20+ financial calculators for better planning</div>
            <div class="feature">🤖 <strong>Bazar.ai</strong> - Get AI-powered financial insights</div>
            <div class="feature">📰 <strong>News & Blogs</strong> - Stay updated with latest financial news</div>
            
            <center><a href="${process.env.FRONTEND_URL || 'http://localhost:3100'}" class="button">Get Started</a></center>
          </div>
          <div class="footer">
            <p>© 2024 FintechOps. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await awsService.sendEmail({
      to,
      subject: 'Welcome to FintechOps!',
      html
    });

    await EmailLog.create({
      to,
      subject: 'Welcome',
      type: 'welcome',
      status: 'sent',
      messageId: result.MessageId
    });

    logger.info(`Welcome email sent to: ${to}`);
    res.json({ message: 'Welcome email sent' });
  } catch (error) {
    logger.error(`Send welcome email error: ${error.message}`);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

// Broadcast email to all subscribers
exports.broadcastEmail = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { subject, html, type = 'newsletter' } = req.body;

    // Get all active subscribers
    const Subscription = require('../models/Subscription');
    const subscribers = await Subscription.find({ 
      isActive: true,
      [`preferences.${type}`]: true
    });

    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      try {
        await awsService.sendEmail({
          to: subscriber.email,
          subject,
          html
        });
        sent++;
      } catch (err) {
        failed++;
        logger.error(`Failed to send to ${subscriber.email}: ${err.message}`);
      }
    }

    logger.info(`Broadcast complete: ${sent} sent, ${failed} failed`);
    res.json({ message: 'Broadcast complete', sent, failed });
  } catch (error) {
    logger.error(`Broadcast email error: ${error.message}`);
    res.status(500).json({ error: 'Failed to broadcast email' });
  }
};
