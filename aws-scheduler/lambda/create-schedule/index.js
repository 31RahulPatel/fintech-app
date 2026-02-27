const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SchedulerClient, CreateScheduleCommand } = require('@aws-sdk/client-scheduler');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const schedulerClient = new SchedulerClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Credentials': true,
    'Content-Type': 'application/json'
  };

  try {
    // Get user info from Cognito claims
    const claims = event.requestContext.authorizer?.claims || {};
    const userId = claims.sub || claims['cognito:username'];
    const userEmail = claims.email;

    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const body = JSON.parse(event.body);
    const { prompt, frequency, time, days, endDate, emailResults = true } = body;

    // Validation
    if (!prompt || !frequency || !time) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: prompt, frequency, time' })
      };
    }

    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid frequency. Use: daily, weekly, monthly' })
      };
    }

    const scheduleId = uuidv4();
    const now = new Date().toISOString();

    // Create schedule item
    const scheduleItem = {
      PK: `USER#${userId}`,
      SK: `SCHEDULE#${scheduleId}`,
      GSI1PK: 'SCHEDULE',
      GSI1SK: `ACTIVE#${now}`,
      scheduleId,
      userId,
      email: userEmail,
      prompt,
      frequency,
      time,
      days: days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      endDate: endDate || null,
      emailResults,
      isActive: true,
      runCount: 0,
      createdAt: now,
      updatedAt: now
    };

    // Save to DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: scheduleItem
    }));

    // Create EventBridge Schedule
    const cronExpression = buildCronExpression(frequency, time, days);
    
    await schedulerClient.send(new CreateScheduleCommand({
      Name: `fintechops-${scheduleId}`,
      GroupName: 'fintechops-schedules',
      ScheduleExpression: cronExpression,
      ScheduleExpressionTimezone: 'Asia/Kolkata',
      Target: {
        Arn: process.env.EXECUTE_LAMBDA_ARN,
        RoleArn: process.env.SCHEDULER_ROLE_ARN,
        Input: JSON.stringify({
          scheduleId,
          userId,
          email: userEmail,
          prompt,
          emailResults
        })
      },
      FlexibleTimeWindow: {
        Mode: 'OFF'
      },
      State: 'ENABLED',
      EndDate: endDate ? new Date(endDate) : undefined
    }));

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Schedule created successfully',
        schedule: {
          scheduleId,
          prompt,
          frequency,
          time,
          days: scheduleItem.days,
          emailResults,
          isActive: true,
          createdAt: now
        }
      })
    };
  } catch (error) {
    console.error('Create schedule error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create schedule' })
    };
  }
};

function buildCronExpression(frequency, time, days) {
  const [hours, minutes] = time.split(':');
  
  switch (frequency) {
    case 'daily':
      return `cron(${minutes} ${hours} * * ? *)`;
    
    case 'weekly':
      const dayMap = {
        'sunday': 'SUN', 'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED',
        'thursday': 'THU', 'friday': 'FRI', 'saturday': 'SAT'
      };
      const cronDays = days.map(d => dayMap[d.toLowerCase()]).join(',');
      return `cron(${minutes} ${hours} ? * ${cronDays} *)`;
    
    case 'monthly':
      return `cron(${minutes} ${hours} 1 * ? *)`;
    
    default:
      return `cron(${minutes} ${hours} * * ? *)`;
  }
}
