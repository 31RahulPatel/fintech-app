const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

exports.handler = async (event) => {
  const startTime = Date.now();
  const resultId = uuidv4();
  const executedAt = new Date().toISOString();

  console.log('Execute prompt event:', JSON.stringify(event));

  // Event comes from EventBridge Scheduler
  const { scheduleId, userId, email, userEmail, prompt, emailResults } = event;
  const recipientEmail = email || userEmail; // Support both field names

  if (!scheduleId || !userId || !prompt) {
    console.error('Missing required fields:', { scheduleId, userId, prompt: !!prompt });
    return { statusCode: 400, error: 'Missing required fields' };
  }

  let response = '';
  let status = 'success';
  let error = null;
  let emailSent = false;

  try {
    // Call Groq API for AI response
    console.log('Calling Groq API...');
    response = await callGroqAPI(prompt);
    console.log('Groq response received:', response.substring(0, 200));

    // Send email if enabled
    if (emailResults && recipientEmail && SES_FROM_EMAIL) {
      try {
        console.log('Attempting to send email to:', recipientEmail);
        await sendEmail(recipientEmail, prompt, response);
        emailSent = true;
        console.log('Email sent successfully to:', recipientEmail);
      } catch (emailError) {
        console.error('Email send error:', emailError.message, emailError);
        // Don't fail execution for email errors
      }
    } else {
      console.log('Email not sent - emailResults:', emailResults, 'recipientEmail:', recipientEmail, 'SES_FROM_EMAIL:', !!SES_FROM_EMAIL);
    }
  } catch (err) {
    console.error('Execution error:', err);
    status = 'failed';
    error = err.message;
  }

  const duration = Date.now() - startTime;

  try {
    // Save execution result
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `SCHEDULE#${scheduleId}`,
        SK: `RESULT#${executedAt}#${resultId}`,
        resultId,
        scheduleId,
        userId,
        prompt,
        response,
        status,
        error,
        emailSent,
        executedAt,
        duration
      }
    }));

    // Update schedule with last run info and increment run count
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `SCHEDULE#${scheduleId}`
      },
      UpdateExpression: 'SET #lastRun = :lastRun, #runCount = if_not_exists(#runCount, :zero) + :one',
      ExpressionAttributeNames: {
        '#lastRun': 'lastRun',
        '#runCount': 'runCount'
      },
      ExpressionAttributeValues: {
        ':lastRun': executedAt,
        ':one': 1,
        ':zero': 0
      }
    }));

    console.log('Execution result saved:', resultId);
  } catch (dbError) {
    console.error('Database error:', dbError);
  }

  return {
    statusCode: status === 'success' ? 200 : 500,
    resultId,
    status,
    duration
  };
};

async function callGroqAPI(prompt) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const systemPrompt = `You are Bazar.ai, an expert financial assistant for FintechOps.
You provide intelligent, data-driven insights for financial operations.
Be concise, professional, and actionable in your responses.
Focus on providing practical financial analysis and recommendations.

Current date: ${new Date().toISOString().split('T')[0]}`;

  const requestBody = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2048
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated';
}

async function sendEmail(toEmail, prompt, response) {
  const subject = `FintechOps Scheduled Report - ${new Date().toLocaleDateString()}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; opacity: 0.9; }
    .content { padding: 24px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .prompt { background: #f8f9fa; border-left: 4px solid #667eea; padding: 12px 16px; border-radius: 4px; font-style: italic; color: #333; }
    .response { background: #f0f9ff; border-radius: 8px; padding: 16px; line-height: 1.6; color: #1a1a1a; white-space: pre-wrap; }
    .footer { background: #f8f9fa; padding: 16px 24px; text-align: center; font-size: 12px; color: #666; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FintechOps</h1>
      <p>Scheduled AI Report</p>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Your Prompt</div>
        <div class="prompt">${escapeHtml(prompt)}</div>
      </div>
      <div class="section">
        <div class="section-title">AI Response</div>
        <div class="response">${escapeHtml(response)}</div>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated report from your FintechOps scheduled prompt.</p>
      <p><a href="#">Manage your schedules</a> | <a href="#">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `FintechOps Scheduled Report

Your Prompt:
${prompt}

AI Response:
${response}

---
This is an automated report from your FintechOps scheduled prompt.`;

  await sesClient.send(new SendEmailCommand({
    Source: SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [toEmail]
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8'
        },
        Text: {
          Data: textBody,
          Charset: 'UTF-8'
        }
      }
    }
  }));
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
