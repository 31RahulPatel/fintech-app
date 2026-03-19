const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const ses = new AWS.SES();
const sns = new AWS.SNS();

// Create nodemailer transporter for local development
const createDevTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

class AWSService {
  async sendEmail({ to, subject, body, html }) {
    try {
      // Use SES in production, nodemailer in development
      if (process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID) {
        const params = {
          Source: process.env.EMAIL_FROM || 'noreply@fintechops.com',
          Destination: {
            ToAddresses: Array.isArray(to) ? to : [to]
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: 'UTF-8'
            },
            Body: {}
          }
        };

        if (html) {
          params.Message.Body.Html = {
            Data: html,
            Charset: 'UTF-8'
          };
        }

        if (body) {
          params.Message.Body.Text = {
            Data: body,
            Charset: 'UTF-8'
          };
        }

        const result = await ses.sendEmail(params).promise();
        logger.info(`SES email sent: ${result.MessageId}`);
        return result;
      } else {
        // Development mode - use nodemailer or just log
        logger.info(`[DEV] Email would be sent to: ${to}, Subject: ${subject}`);
        
        if (process.env.SMTP_HOST) {
          const transporter = createDevTransporter();
          const result = await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'noreply@fintechops.com',
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            text: body,
            html
          });
          logger.info(`Dev email sent: ${result.messageId}`);
          return { MessageId: result.messageId };
        }

        return { MessageId: `dev-${Date.now()}` };
      }
    } catch (error) {
      logger.error(`Send email error: ${error.message}`);
      throw error;
    }
  }

  async sendSMS({ phoneNumber, message }) {
    try {
      if (process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID) {
        const params = {
          Message: message,
          PhoneNumber: phoneNumber,
          MessageAttributes: {
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional'
            }
          }
        };

        const result = await sns.publish(params).promise();
        logger.info(`SNS SMS sent: ${result.MessageId}`);
        return result;
      } else {
        logger.info(`[DEV] SMS would be sent to: ${phoneNumber}, Message: ${message}`);
        return { MessageId: `dev-sms-${Date.now()}` };
      }
    } catch (error) {
      logger.error(`Send SMS error: ${error.message}`);
      throw error;
    }
  }

  async publishToTopic({ topicArn, subject, message }) {
    try {
      const params = {
        TopicArn: topicArn,
        Subject: subject,
        Message: message
      };

      const result = await sns.publish(params).promise();
      logger.info(`SNS topic published: ${result.MessageId}`);
      return result;
    } catch (error) {
      logger.error(`Publish to topic error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new AWSService();
