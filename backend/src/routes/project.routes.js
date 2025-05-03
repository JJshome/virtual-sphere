const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// 프로젝트 생성
router.post('/', verifyToken, projectController.createProject);

// 모든 프로젝트 조회
router.get('/', verifyToken, projectController.getProjects);

// 특정 프로젝트 조회
router.get('/:projectId', verifyToken, projectController.getProjectById);

// 프로젝트 업데이트
router.put('/:projectId', verifyToken, projectController.updateProject);

// 프로젝트 삭제
router.delete('/:projectId', verifyToken, projectController.deleteProject);

// 프로젝트 멤버 추가
router.post('/:projectId/members', verifyToken, projectController.addProjectMember);

// 프로젝트 멤버 제거
router.delete('/:projectId/members/:userId', verifyToken, projectController.removeProjectMember);

// 프로젝트에 가상 휴먼 추가
router.post('/:projectId/virtual-humans', verifyToken, projectController.addVirtualHumanToProject);

// 프로젝트 데이터 분석 요청
router.post('/:projectId/analyze', verifyToken, projectController.analyzeProjectData);

// 추천 프로젝트 조회
router.get('/recommended', verifyToken, projectController.getRecommendedProjects);

module.exports = router;
