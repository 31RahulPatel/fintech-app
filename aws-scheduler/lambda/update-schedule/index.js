const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { SchedulerClient, UpdateScheduleCommand, GetScheduleCommand } = require('@aws-sdk/client-scheduler');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const schedulerClient = new SchedulerClient({});

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const EXECUTE_LAMBDA_ARN = process.env.EXECUTE_LAMBDA_ARN;
const SCHEDULER_ROLE_ARN = process.env.SCHEDULER_ROLE_ARN;

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
    const scheduleId = event.pathParameters?.scheduleId;

    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    if (!scheduleId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Schedule ID required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { prompt, frequency, time, days, endDate, emailResults } = body;

    // Verify schedule exists and belongs to user
    const existing = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `SCHEDULE#${scheduleId}`
      }
    }));

    if (!existing.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Schedule not found' })
      };
    }

    const now = new Date().toISOString();
    const cronExpression = buildCronExpression(
      frequency || existing.Item.frequency,
      time || existing.Item.time,
      days || existing.Item.days
    );

    // Update DynamoDB
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = { ':updatedAt': now };

    if (prompt !== undefined) {
      updateExpression.push('#prompt = :prompt');
      expressionAttributeNames['#prompt'] = 'prompt';
      expressionAttributeValues[':prompt'] = prompt;
    }
    if (frequency !== undefined) {
      updateExpression.push('#frequency = :frequency');
      expressionAttributeNames['#frequency'] = 'frequency';
      expressionAttributeValues[':frequency'] = frequency;
    }
    if (time !== undefined) {
      updateExpression.push('#time = :time');
      expressionAttributeNames['#time'] = 'time';
      expressionAttributeValues[':time'] = time;
    }
    if (days !== undefined) {
      updateExpression.push('#days = :days');
      expressionAttributeNames['#days'] = 'days';
      expressionAttributeValues[':days'] = days;
    }
    if (endDate !== undefined) {
      updateExpression.push('#endDate = :endDate');
      expressionAttributeNames['#endDate'] = 'endDate';
      expressionAttributeValues[':endDate'] = endDate;
    }
    if (emailResults !== undefined) {
      updateExpression.push('#emailResults = :emailResults');
      expressionAttributeNames['#emailResults'] = 'emailResults';
      expressionAttributeValues[':emailResults'] = emailResults;
    }

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';

    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `SCHEDULE#${scheduleId}`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));

    // Update EventBridge schedule
    const scheduleName = `fintechops-${userId}-${scheduleId}`;

    try {
      await schedulerClient.send(new UpdateScheduleCommand({
        Name: scheduleName,
        ScheduleExpression: cronExpression,
        ScheduleExpressionTimezone: 'UTC',
        EndDate: endDate ? new Date(endDate) : undefined,
        Target: {
          Arn: EXECUTE_LAMBDA_ARN,
          RoleArn: SCHEDULER_ROLE_ARN,
          Input: JSON.stringify({
            scheduleId,
            userId,
            userEmail,
            prompt: prompt || existing.Item.prompt,
            emailResults: emailResults ?? existing.Item.emailResults
          })
        },
        FlexibleTimeWindow: { Mode: 'OFF' },
        State: existing.Item.isActive ? 'ENABLED' : 'DISABLED'
      }));
    } catch (scheduleError) {
      console.error('EventBridge update error:', scheduleError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Schedule updated',
        scheduleId
      })
    };
  } catch (error) {
    console.error('Update schedule error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update schedule' })
    };
  }
};

function buildCronExpression(frequency, time, days) {
  const [hours, minutes] = time.split(':');

  switch (frequency) {
    case 'daily':
      return `cron(${minutes} ${hours} * * ? *)`;
    case 'weekly':
      const dayMap = { sun: 1, mon: 2, tue: 3, wed: 4, thu: 5, fri: 6, sat: 7 };
      const dayNumbers = days.map(d => dayMap[d]).join(',');
      return `cron(${minutes} ${hours} ? * ${dayNumbers} *)`;
    case 'monthly':
      const dayOfMonth = days[0] || 1;
      return `cron(${minutes} ${hours} ${dayOfMonth} * ? *)`;
    default:
      return `cron(${minutes} ${hours} * * ? *)`;
  }
}
