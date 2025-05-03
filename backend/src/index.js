require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const routes = require('./routes');
const { setupSocketHandlers } = require('./socket');
const { logger } = require('./utils/logger');

// 앱 초기화
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우트 설정
app.use('/api', routes);

// 소켓 핸들러 설정
setupSocketHandlers(io);

// 몽고DB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/virtualsphere')
  .then(() => {
    logger.info('MongoDB 연결 성공');
  })
  .catch((error) => {
    logger.error('MongoDB 연결 실패:', error);
    process.exit(1);
  });

// 서버 시작
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`서버가 포트 ${PORT}에서 실행 중입니다`);
});

// 예상치 못한 오류 처리
process.on('uncaughtException', (error) => {
  logger.error('예상치 못한 오류 발생:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('처리되지 않은 프로미스 거부:', reason);
});

module.exports = { app, server };
