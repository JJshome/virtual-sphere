const { logger } = require('../utils/logger');
const { verifySocketToken } = require('../middlewares/auth.middleware');
const { processMessage } = require('../services/llm.service');
const { updateUserStatus } = require('../services/user.service');

const setupSocketHandlers = (io) => {
  // 미들웨어 - 인증 확인
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('인증 토큰이 없습니다'));
    }

    try {
      const decoded = verifySocketToken(token);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('인증 실패: ' + error.message));
    }
  });

  // 연결 이벤트 처리
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info(`사용자 ${userId} 연결됨`);

    // 사용자 상태 업데이트 (온라인)
    updateUserStatus(userId, 'online');

    // 룸 참가
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      logger.info(`사용자 ${userId}가 룸 ${roomId}에 참가함`);
      
      // 룸 참가 알림
      socket.to(roomId).emit('user-joined', {
        userId: userId,
        timestamp: new Date().toISOString()
      });
    });

    // 룸 나가기
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      logger.info(`사용자 ${userId}가 룸 ${roomId}에서 나감`);
      
      // 룸 퇴장 알림
      socket.to(roomId).emit('user-left', {
        userId: userId,
        timestamp: new Date().toISOString()
      });
    });

    // 메시지 수신 및 처리
    socket.on('send-message', async (data) => {
      const { roomId, message, receiverId, type } = data;
      
      logger.info(`사용자 ${userId}가 메시지 전송: ${roomId}`);
      
      // 메시지 저장 및 전송
      const messageData = {
        senderId: userId,
        receiverId,
        message,
        type: type || 'text',
        timestamp: new Date().toISOString()
      };
      
      // 룸에 메시지 브로드캐스트
      io.to(roomId).emit('new-message', messageData);
      
      // LLM으로 메시지 처리 (가상 휴먼 대화)
      if (type === 'virtual-human') {
        try {
          const response = await processMessage(message, receiverId);
          
          const virtualHumanResponse = {
            senderId: receiverId,
            receiverId: userId,
            message: response,
            type: 'virtual-human',
            timestamp: new Date().toISOString()
          };
          
          io.to(roomId).emit('new-message', virtualHumanResponse);
        } catch (error) {
          logger.error('가상 휴먼 응답 처리 중 오류:', error);
          
          socket.emit('error', {
            message: '가상 휴먼 응답 처리 중 오류가 발생했습니다'
          });
        }
      }
    });

    // 타이핑 상태 이벤트
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data;
      socket.to(roomId).emit('user-typing', {
        userId,
        isTyping
      });
    });

    // 연결 해제
    socket.on('disconnect', () => {
      logger.info(`사용자 ${userId} 연결 해제됨`);
      
      // 사용자 상태 업데이트 (오프라인)
      updateUserStatus(userId, 'offline');
    });
  });
};

module.exports = { setupSocketHandlers };
