const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SchedulerClient, DeleteScheduleCommand } = require('@aws-sdk/client-scheduler');

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

    // Delete from EventBridge first
    const scheduleName = `fintechops-${userId}-${scheduleId}`;
    try {
      await schedulerClient.send(new DeleteScheduleCommand({
        Name: scheduleName
      }));
    } catch (scheduleError) {
      // Schedule might not exist if creation failed
      console.warn('EventBridge delete warning:', scheduleError);
    }

    // Delete schedule from DynamoDB
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `SCHEDULE#${scheduleId}`
      }
    }));

    // Also delete all related execution results
    const results = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `SCHEDULE#${scheduleId}`
      }
    }));

    // Batch delete results (if any)
    if (results.Items && results.Items.length > 0) {
      const { BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
      const deleteRequests = results.Items.map(item => ({
        DeleteRequest: {
          Key: {
            PK: item.PK,
            SK: item.SK
          }
        }
      }));

      // DynamoDB batch write has 25 item limit
      for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25);
        await docClient.send(new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: batch
          }
        }));
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Schedule deleted',
        scheduleId
      })
    };
  } catch (error) {
    console.error('Delete schedule error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete schedule' })
    };
  }
};
