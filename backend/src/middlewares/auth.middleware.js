const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

/**
 * JWT 토큰 검증 미들웨어
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증 토큰이 제공되지 않았습니다' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('토큰 검증 실패:', error);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
  }
};

/**
 * 소켓 연결용 JWT 토큰 검증
 */
const verifySocketToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
  } catch (error) {
    logger.error('소켓 토큰 검증 실패:', error);
    throw new Error('유효하지 않은 토큰입니다');
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: '관리자 권한이 필요합니다' });
  }
};

module.exports = {
  verifyToken,
  verifySocketToken,
  isAdmin
};
