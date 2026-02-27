// API Configuration
// After deploying to AWS, update SCHEDULER_API_URL with your API Gateway endpoint

// Local development (uses chatbot-service)
const LOCAL_API_URL = 'http://localhost:3003/api';

// AWS API Gateway (deployed endpoint)
const AWS_SCHEDULER_API_URL = process.env.REACT_APP_SCHEDULER_API_URL || 'https://19y6ll5x70.execute-api.us-east-1.amazonaws.com/prod';

// Use AWS if configured, otherwise fall back to local
export const SCHEDULER_API_URL = AWS_SCHEDULER_API_URL || `${LOCAL_API_URL}/scheduled-prompts`;

// Feature flag to determine which backend to use
export const USE_AWS_SCHEDULER = !!AWS_SCHEDULER_API_URL;

// API base URLs
export const API_CONFIG = {
  // Core services (always use local Docker services)
  AUTH_API: 'http://localhost:3001/api',
  USER_API: 'http://localhost:3002/api',
  CHATBOT_API: 'http://localhost:3003/api',
  MARKET_API: '/market-api',
  NEWS_API: '/news-api',
  ANALYTICS_API: 'http://localhost:3006/api',
  NOTIFICATION_API: 'http://localhost:3007/api',
  PAYMENT_API: 'http://localhost:3008/api',
  RISK_API: 'http://localhost:3009/api',
  EMAIL_API: 'http://localhost:3010/api',
  
  // Scheduler - uses AWS when configured
  SCHEDULER_API: SCHEDULER_API_URL
};

export default API_CONFIG;
