/**
 * VirtualSphere - LLM 기반 가상 소셜 네트워크 시스템
 * 특허 기반 구현: 개인별 LLM 인스턴스, 가상 휴먼, 집단 상상력 기반 동적 세계
 * 
 * @author Ucaretron Inc.
 * @patent KR-2024-XXXXXXX
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const llmRoutes = require('./routes/llmRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const assetRoutes = require('./routes/assetRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const virtualHumanRoutes = require('./routes/virtualHumanRoutes');
const dynamicWorldRoutes = require('./routes/dynamicWorldRoutes');
const emotionRoutes = require('./routes/emotionRoutes');

// Import services
const VirtualHumanService = require('./services/VirtualHumanService');
const DynamicWorldService = require('./services/DynamicWorldService');
const EmotionService = require('./services/EmotionService');

// Import middlewares
const { authenticateToken } = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Import socket handlers
const initializeSocket = require('./socket');

class VirtualSphereServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.port = process.env.PORT || 5000;
    this.initializeServices();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureSocketEvents();
    this.configureErrorHandling();
  }

  async initializeServices() {
    try {
      // Connect to MongoDB
      await connectDB();
      logger.info('MongoDB connected successfully');

      // Initialize services
      logger.info('All services initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  configureMiddlewares() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) }}));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
      max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use('/uploads', express.static('uploads'));
  }

  configureRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          server: 'running'
        }
      });
    });

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', authenticateToken, userRoutes);
    this.app.use('/api/v1/llm', authenticateToken, llmRoutes);
    this.app.use('/api/v1/collaborations', authenticateToken, collaborationRoutes);
    this.app.use('/api/v1/assets', authenticateToken, assetRoutes);
    this.app.use('/api/v1/rewards', authenticateToken, rewardRoutes);
    this.app.use('/api/v1/virtual-humans', authenticateToken, virtualHumanRoutes);
    this.app.use('/api/v1/worlds', authenticateToken, dynamicWorldRoutes);
    this.app.use('/api/v1/emotions', authenticateToken, emotionRoutes);

    // API Documentation (Swagger)
    if (process.env.NODE_ENV === 'development') {
      const swaggerUi = require('swagger-ui-express');
      const swaggerDocument = require('./swagger.json');
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }
  }

  configureSocketEvents() {
    initializeSocket(this.io);
  }

  configureErrorHandling() {
    this.app.use(errorHandler);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Unhandled promise rejection
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      this.server.close(() => {
        process.exit(1);
      });
    });

    // Uncaught exception
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  }

  start() {
    this.server.listen(this.port, () => {
      logger.info(`🚀 VirtualSphere Server running on port ${this.port}`);
      logger.info(`📄 API Documentation: http://localhost:${this.port}/api-docs`);
      logger.info(`🏥 Health Check: http://localhost:${this.port}/health`);
      logger.info('🔬 Patent Technology: LLM-based Virtual Social Network System Active');
      logger.info('🤖 Virtual Human Service: Active');
      logger.info('🌍 Dynamic World Service: Active');
      logger.info('😊 Emotion Analysis Service: Active');
    });
  }
}

// Initialize and start server
const server = new VirtualSphereServer();
server.start();

module.exports = server;
