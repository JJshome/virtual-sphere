/**
 * Database Service - VirtualSphere System
 * MongoDB 연결 및 관리
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/virtualsphere';
  }

  async initialize() {
    try {
      // MongoDB 연결 옵션
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: parseInt(process.env.DATABASE_POOL_SIZE) || 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0
      };

      // 연결 이벤트 리스너
      mongoose.connection.on('connected', () => {
        this.isConnected = true;
        logger.info('MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        this.isConnected = false;
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        logger.warn('MongoDB disconnected');
      });

      // 연결 시도
      await mongoose.connect(this.connectionString, options);

      logger.info('Database service initialized');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  isConnected() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async close() {
    if (this.isConnected) {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }
}

module.exports = new DatabaseService();
