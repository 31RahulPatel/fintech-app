const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

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

    // Verify user owns this schedule
    const schedule = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `SCHEDULE#${scheduleId}`
      }
    }));

    if (!schedule.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Schedule not found' })
      };
    }

    // Get limit from query params
    const limit = parseInt(event.queryStringParameters?.limit || '20', 10);
    const lastEvaluatedKey = event.queryStringParameters?.nextToken
      ? JSON.parse(Buffer.from(event.queryStringParameters.nextToken, 'base64').toString())
      : undefined;

    // Query execution results
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `SCHEDULE#${scheduleId}`,
        ':sk': 'RESULT#'
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
      ExclusiveStartKey: lastEvaluatedKey
    }));

    const results = (result.Items || []).map(item => ({
      resultId: item.resultId,
      scheduleId: item.scheduleId,
      prompt: item.prompt,
      response: item.response,
      status: item.status,
      error: item.error,
      emailSent: item.emailSent,
      executedAt: item.executedAt,
      duration: item.duration
    }));

    const response = {
      results,
      count: results.length,
      schedule: {
        prompt: schedule.Item.prompt,
        frequency: schedule.Item.frequency,
        time: schedule.Item.time,
        isActive: schedule.Item.isActive,
        runCount: schedule.Item.runCount || 0,
        lastRun: schedule.Item.lastRun
      }
    };

    if (result.LastEvaluatedKey) {
      response.nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Get results error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch results' })
    };
  }
};
