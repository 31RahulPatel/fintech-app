const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  try {
    const token = event.authorizationToken?.replace('Bearer ', '');
    
    if (!token) {
      return generatePolicy('anonymous', 'Deny', event.methodArn);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Create policy with user context
    const policy = generatePolicy(decoded.userId, 'Allow', event.methodArn);
    policy.context = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user'
    };
    
    return policy;
  } catch (error) {
    console.error('Authorization error:', error);
    return generatePolicy('anonymous', 'Deny', event.methodArn);
  }
};

function generatePolicy(principalId, effect, resource) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    }
  };
}
