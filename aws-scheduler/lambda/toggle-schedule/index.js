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

    // Get existing schedule
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

    const newActiveState = !existing.Item.isActive;
    const now = new Date().toISOString();

    // Update DynamoDB
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `SCHEDULE#${scheduleId}`
      },
      UpdateExpression: 'SET #isActive = :isActive, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#isActive': 'isActive',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':isActive': newActiveState,
        ':updatedAt': now
      }
    }));

    // Update EventBridge schedule state
    const scheduleName = `fintechops-${userId}-${scheduleId}`;

    try {
      // Get current schedule to preserve settings
      const currentSchedule = await schedulerClient.send(new GetScheduleCommand({
        Name: scheduleName
      }));

      await schedulerClient.send(new UpdateScheduleCommand({
        Name: scheduleName,
        ScheduleExpression: currentSchedule.ScheduleExpression,
        ScheduleExpressionTimezone: currentSchedule.ScheduleExpressionTimezone,
        EndDate: currentSchedule.EndDate,
        Target: currentSchedule.Target,
        FlexibleTimeWindow: currentSchedule.FlexibleTimeWindow,
        State: newActiveState ? 'ENABLED' : 'DISABLED'
      }));
    } catch (scheduleError) {
      console.error('EventBridge toggle error:', scheduleError);
      // Don't fail the request, DynamoDB is source of truth
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `Schedule ${newActiveState ? 'activated' : 'paused'}`,
        scheduleId,
        isActive: newActiveState
      })
    };
  } catch (error) {
    console.error('Toggle schedule error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to toggle schedule' })
    };
  }
};
