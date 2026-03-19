require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const cron = require('node-cron');
const routes = require('./routes');
const schedulerService = require('./services/schedulerService');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'chatbot-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/', routes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fintechops')
  .then(() => {
    logger.info('MongoDB connected');
    // Initialize scheduler
    schedulerService.initializeScheduler();
  })
  .catch(err => logger.error('MongoDB connection error:', err));

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

app.listen(PORT, () => {
  logger.info(`Chatbot Service (Bazar.ai) running on port ${PORT}`);
});

module.exports = app;
