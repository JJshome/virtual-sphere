const express = require('express');
const router = express.Router();

// 라우트 모듈 가져오기
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const virtualHumanRoutes = require('./virtualHuman.routes');
const projectRoutes = require('./project.routes');
const nftRoutes = require('./nft.routes');

// 라우트 마운트
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/virtual-humans', virtualHumanRoutes);
router.use('/projects', projectRoutes);
router.use('/nft', nftRoutes);

// 기본 API 상태 확인 라우트
router.get('/', (req, res) => {
  res.json({ message: 'VirtualSphere API가 정상적으로 작동 중입니다' });
});

module.exports = router;
