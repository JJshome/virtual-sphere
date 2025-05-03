const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// 사용자 프로필 조회
router.get('/profile', verifyToken, userController.getProfile);

// 사용자 프로필 업데이트
router.put('/profile', verifyToken, userController.updateProfile);

// 사용자 관심사 업데이트
router.put('/interests', verifyToken, userController.updateInterests);

// 추천 사용자 목록 조회
router.get('/recommended', verifyToken, userController.getRecommendedUsers);

// 특정 사용자 정보 조회
router.get('/:userId', verifyToken, userController.getUserById);

// 사용자 검색
router.get('/search', verifyToken, userController.searchUsers);

module.exports = router;
