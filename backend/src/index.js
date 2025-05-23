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

// Import core services (Patent Implementation)
const DatabaseService = require('./services/database');
const LLMOrchestrator = require('./services/llm/orchestrator');
const VirtualHumanService = require('./services/virtual-human');
const EmotionAnalysisService = require('./services/emotion-analysis');
const WorldGenerationService = require('./services/world-generation');
const BlockchainService = require('./services/blockchain');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const llmRoutes = require('./routes/llm');
const virtualHumanRoutes = require('./routes/virtual-humans');
const worldRoutes = require('./routes/worlds');
const emotionRoutes = require('./routes/emotions');
const collaborationRoutes = require('./routes/collaborations');
const assetRoutes = require('./routes/assets');
const rewardRoutes = require('./routes/rewards');

// Import middlewares
const authMiddleware = require('./middlewares/auth');
const errorHandler = require('./middlewares/error-handler');
const logger = require('./utils/logger');

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
      // Initialize Database
      await DatabaseService.initialize();
      logger.info('Database connected successfully');

      // Initialize LLM Orchestrator (Patent Core)
      await LLMOrchestrator.initialize();
      logger.info('LLM Orchestrator initialized');

      // Initialize Virtual Human Service (Patent Core)
      await VirtualHumanService.initialize();
      logger.info('Virtual Human Service initialized');

      // Initialize Emotion Analysis Service (Patent Core)
      await EmotionAnalysisService.initialize();
      logger.info('Emotion Analysis Service initialized');

      // Initialize World Generation Service (Patent Core)
      await WorldGenerationService.initialize();
      logger.info('World Generation Service initialized');

      // Initialize Blockchain Service (Patent Implementation)
      if (process.env.NODE_ENV !== 'development' || !process.env.MOCK_BLOCKCHAIN) {
        await BlockchainService.initialize();
        logger.info('Blockchain Service initialized');
      }

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
          database: DatabaseService.isConnected(),
          llm: LLMOrchestrator.isActive(),
          virtualHuman: VirtualHumanService.isActive(),
          emotion: EmotionAnalysisService.isActive(),
          world: WorldGenerationService.isActive(),
          blockchain: BlockchainService.isActive()
        }
      });
    });

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', authMiddleware, userRoutes);
    this.app.use('/api/v1/llm', authMiddleware, llmRoutes);
    this.app.use('/api/v1/virtual-humans', authMiddleware, virtualHumanRoutes);
    this.app.use('/api/v1/worlds', authMiddleware, worldRoutes);
    this.app.use('/api/v1/emotions', authMiddleware, emotionRoutes);
    this.app.use('/api/v1/collaborations', authMiddleware, collaborationRoutes);
    this.app.use('/api/v1/assets', authMiddleware, assetRoutes);
    this.app.use('/api/v1/rewards', authMiddleware, rewardRoutes);

    // API Documentation (Swagger)
    if (process.env.SWAGGER_ENABLED === 'true') {
      const swaggerUi = require('swagger-ui-express');
      const swaggerSpec = require('./utils/swagger');
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }
  }

  configureSocketEvents() {
    const SocketHandler = require('./socket/handler');
    new SocketHandler(this.io);
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
    });
  }
}

// Initialize and start server
const server = new VirtualSphereServer();
server.start();

module.exports = server;
