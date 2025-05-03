const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// 회원가입
router.post('/register', authController.register);

// 로그인
router.post('/login', authController.login);

// 로그아웃
router.post('/logout', authController.logout);

// 현재 사용자 정보 조회
router.get('/me', verifyToken, authController.getCurrentUser);

// 사용자 비밀번호 변경
router.post('/change-password', verifyToken, authController.changePassword);

// 비밀번호 재설정 요청
router.post('/forgot-password', authController.forgotPassword);

// 비밀번호 재설정
router.post('/reset-password', authController.resetPassword);

module.exports = router;
