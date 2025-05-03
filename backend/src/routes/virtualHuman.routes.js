const express = require('express');
const router = express.Router();
const virtualHumanController = require('../controllers/virtualHuman.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// 가상 휴먼 생성
router.post('/', verifyToken, virtualHumanController.createVirtualHuman);

// 사용자의 가상 휴먼 목록 조회
router.get('/', verifyToken, virtualHumanController.getVirtualHumans);

// 특정 가상 휴먼 조회
router.get('/:virtualHumanId', verifyToken, virtualHumanController.getVirtualHumanById);

// 가상 휴먼 업데이트
router.put('/:virtualHumanId', verifyToken, virtualHumanController.updateVirtualHuman);

// 가상 휴먼 삭제
router.delete('/:virtualHumanId', verifyToken, virtualHumanController.deleteVirtualHuman);

// 가상 휴먼과 대화
router.post('/:virtualHumanId/chat', verifyToken, virtualHumanController.chatWithVirtualHuman);

// 가상 휴먼 작업 할당
router.post('/:virtualHumanId/tasks', verifyToken, virtualHumanController.assignTask);

// 가상 휴먼 작업 목록 조회
router.get('/:virtualHumanId/tasks', verifyToken, virtualHumanController.getVirtualHumanTasks);

module.exports = router;
