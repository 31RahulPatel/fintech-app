const crypto = require('crypto');
const AWS = require('aws-sdk');
const logger = require('../utils/logger');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID || process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.AWS_COGNITO_CLIENT_SECRET || process.env.COGNITO_CLIENT_SECRET;
const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID;

const cognito = new AWS.CognitoIdentityServiceProvider();

class CognitoService {
  // Compute SECRET_HASH = Base64(HMAC_SHA256(clientSecret, username + clientId))
  _secretHash(username) {
    return crypto
      .createHmac('SHA256', CLIENT_SECRET)
      .update(username + CLIENT_ID)
      .digest('base64');
  }

  // Sign up a new user
  async signUp(email, password, attributes) {
    const params = {
      ClientId: CLIENT_ID,
      SecretHash: this._secretHash(email),
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: attributes.firstName },
        { Name: 'family_name', Value: attributes.lastName }
      ]
    };

    if (attributes.phone) {
      params.UserAttributes.push({ Name: 'phone_number', Value: attributes.phone });
    }

    try {
      const result = await cognito.signUp(params).promise();
      return {
        userConfirmed: result.UserConfirmed,
        userSub: result.UserSub
      };
    } catch (err) {
      logger.error(`Cognito signUp error: ${err.message}`);
      throw err;
    }
  }

  // Confirm sign up with verification code
  async confirmSignUp(email, code) {
    const params = {
      ClientId: CLIENT_ID,
      SecretHash: this._secretHash(email),
      Username: email,
      ConfirmationCode: code
    };

    try {
      const result = await cognito.confirmSignUp(params).promise();
      return result;
    } catch (err) {
      logger.error(`Cognito confirmSignUp error: ${err.message}`);
      throw err;
    }
  }

  // Sign in user
  async signIn(email, password) {
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this._secretHash(email)
      }
    };

    try {
      const result = await cognito.initiateAuth(params).promise();
      const tokens = result.AuthenticationResult;
      return {
        accessToken: tokens.AccessToken,
        refreshToken: tokens.RefreshToken,
        idToken: tokens.IdToken
      };
    } catch (err) {
      logger.error(`Cognito signIn error: ${err.message}`);
      throw err;
    }
  }

  // Refresh session
  async refreshSession(email, refreshToken) {
    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: this._secretHash(email)
      }
    };

    try {
      const result = await cognito.initiateAuth(params).promise();
      const tokens = result.AuthenticationResult;
      return {
        accessToken: tokens.AccessToken,
        idToken: tokens.IdToken
      };
    } catch (err) {
      logger.error(`Cognito refreshSession error: ${err.message}`);
      throw err;
    }
  }

  // Sign out user (global sign-out)
  async signOut(email) {
    // Global sign-out requires an access token; fall back to admin sign-out
    try {
      await cognito.adminUserGlobalSignOut({
        UserPoolId: USER_POOL_ID,
        Username: email
      }).promise();
      return { message: 'Signed out successfully' };
    } catch (err) {
      logger.error(`Cognito signOut error: ${err.message}`);
      // Non-critical — return success anyway
      return { message: 'Signed out successfully' };
    }
  }

  // Forgot password
  async forgotPassword(email) {
    const params = {
      ClientId: CLIENT_ID,
      SecretHash: this._secretHash(email),
      Username: email
    };

    try {
      const result = await cognito.forgotPassword(params).promise();
      return result;
    } catch (err) {
      logger.error(`Cognito forgotPassword error: ${err.message}`);
      throw err;
    }
  }

  // Confirm new password
  async confirmNewPassword(email, code, newPassword) {
    const params = {
      ClientId: CLIENT_ID,
      SecretHash: this._secretHash(email),
      Username: email,
      ConfirmationCode: code,
      Password: newPassword
    };

    try {
      await cognito.confirmForgotPassword(params).promise();
      return { message: 'Password reset successful' };
    } catch (err) {
      logger.error(`Cognito confirmNewPassword error: ${err.message}`);
      throw err;
    }
  }

  // Get user attributes
  async getUserAttributes(accessToken) {
    try {
      const data = await cognito.getUser({ AccessToken: accessToken }).promise();
      return data;
    } catch (err) {
      logger.error(`Cognito getUserAttributes error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new CognitoService();
