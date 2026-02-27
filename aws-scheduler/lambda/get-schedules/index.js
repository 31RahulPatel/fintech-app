const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

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
    const userEmail = claims.email;

    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Query all schedules for user
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'SCHEDULE#'
      },
      ScanIndexForward: false
    }));

    const schedules = (result.Items || []).map(item => ({
      _id: item.scheduleId,
      scheduleId: item.scheduleId,
      prompt: item.prompt,
      frequency: item.frequency,
      time: item.time,
      days: item.days,
      endDate: item.endDate,
      emailResults: item.emailResults,
      isActive: item.isActive,
      runCount: item.runCount || 0,
      lastRun: item.lastRun,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        schedules,
        count: schedules.length
      })
    };
  } catch (error) {
    console.error('Get schedules error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch schedules' })
    };
  }
};
