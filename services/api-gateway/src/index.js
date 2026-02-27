require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('./utils/logger');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Service routes configuration
const services = {
  '/api/auth': {
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    public: true
  },
  '/api/users': {
    target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    public: false
  },
  '/api/market': {
    target: process.env.MARKET_SERVICE_URL || 'http://localhost:3003',
    public: true,
    premiumRoutes: ['/prostocks']
  },
  '/api/news': {
    target: process.env.NEWS_SERVICE_URL || 'http://localhost:3004',
    public: true
  },
  '/api/blogs': {
    target: process.env.BLOG_SERVICE_URL || 'http://localhost:3005',
    public: true
  },
  '/api/calculators': {
    target: process.env.CALCULATOR_SERVICE_URL || 'http://localhost:3006',
    public: true,
    freeRoutes: ['/sip', '/compound-interest', '/lumpsum']
  },
  '/api/chatbot': {
    target: process.env.CHATBOT_SERVICE_URL || 'http://localhost:3007',
    public: false
  },
  '/api/email': {
    target: process.env.EMAIL_SERVICE_URL || 'http://localhost:3008',
    public: false
  },
  '/api/admin': {
    target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3009',
    public: false,
    adminOnly: true
  }
};

// Public subscribe/unsubscribe endpoints (no auth required)
const emailPublicProxy = createProxyMiddleware({
  target: services['/api/email'].target,
  changeOrigin: true,
  pathRewrite: { '^/api/email': '' },
  onError: (err, req, res) => {
    logger.error(`Proxy error for /api/email (public): ${err.message}`);
    res.status(503).json({ error: 'Service temporarily unavailable' });
  },
  onProxyReq: (proxyReq, req) => {
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
});
app.post('/api/email/subscribe', emailPublicProxy);
app.post('/api/email/unsubscribe', emailPublicProxy);
logger.info('Public routes configured: POST /api/email/subscribe, POST /api/email/unsubscribe');

// Setup proxy routes
Object.entries(services).forEach(([path, config]) => {
  const middleware = [];

  // Add auth middleware for protected routes
  if (!config.public) {
    middleware.push(authMiddleware.verifyToken);
  }

  // Add admin middleware for admin routes
  if (config.adminOnly) {
    middleware.push(authMiddleware.verifyAdmin);
  }

  // Create proxy
  const proxy = createProxyMiddleware({
    target: config.target,
    changeOrigin: true,
    pathRewrite: { [`^${path}`]: '' },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${path}: ${err.message}`);
      res.status(503).json({ error: 'Service temporarily unavailable' });
    },
    onProxyReq: (proxyReq, req) => {
      // Forward user info if authenticated
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Role', req.user.role || 'user');
      }
      // Re-stream body consumed by express.json()
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  });

  if (middleware.length > 0) {
    app.use(path, ...middleware, proxy);
  } else {
    app.use(path, proxy);
  }

  logger.info(`Route configured: ${path} -> ${config.target}`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

module.exports = app;
