require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check - MUST be database-independent
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'auth-service', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Routes
app.use('/', routes);

// Start server first, then connect to databases
const server = app.listen(PORT, () => {
  logger.info(`Auth Service running on port ${PORT}`);
  
  // Connect to databases after server starts (non-blocking)
  connectDatabases();
});

// Database connections (async, non-blocking)
async function connectDatabases() {
  try {
    // MongoDB connection
    if (process.env.MONGODB_URI) {
      const mongoose = require('mongoose');
      const mongoOptions = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        waitQueueTimeoutMS: 30000,
        retryWrites: true,
        retryReads: true
      };
      
      await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
      logger.info('MongoDB connected');
    }
    
    // PostgreSQL connection
    if (process.env.POSTGRESQL_URI) {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(process.env.POSTGRESQL_URI, {
        logging: msg => logger.debug(msg),
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000
        }
      });
      
      await sequelize.authenticate();
      logger.info('PostgreSQL connected');
      app.set('sequelize', sequelize);
    }
  } catch (err) {
    logger.error('Database connection error (non-fatal):', err.message);
  }
}

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

module.exports = { app, server };
