const VirtualHuman = require('../models/VirtualHuman');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { processMessage } = require('../services/llm.service');

/**
 * 가상 휴먼 생성
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const createVirtualHuman = async (req, res) => {
  try {
    const { name, personality, description, interests, skills, goals } = req.body;
    const userId = req.user.id;
    
    // 필수 필드 확인
    if (!name) {
      return res.status(400).json({ message: '가상 휴먼 이름은 필수 입력 항목입니다.' });
    }
    
    // 사용자 확인
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 가상 휴먼 생성
    const virtualHuman = new VirtualHuman({
      name,
      owner: userId,
      personality: personality || 'balanced',
      description: description || `${name}은 ${user.username}의 가상 휴먼입니다.`,
      interests: interests || [],
      skills: skills || [],
      goals: goals || []
    });
    
    // 가상 휴먼 저장
    await virtualHuman.save();
    
    // 사용자 정보 업데이트
    await User.findByIdAndUpdate(userId, {
      $push: { virtualHumans: virtualHuman._id }
    });
    
    res.status(201).json({
      message: '가상 휴먼이 성공적으로 생성되었습니다.',
      virtualHuman
    });
    
    logger.info(`사용자 ${userId}가 새 가상 휴먼 생성: ${name}`);
  } catch (error) {
    logger.error('가상 휴먼 생성 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 사용자의 가상 휴먼 목록 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getVirtualHumans = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 사용자의 가상 휴먼 목록 조회
    const virtualHumans = await VirtualHuman.find({ owner: userId })
      .select('name avatar personality description interests skills goals isActive lastInteraction');
    
    res.status(200).json({ virtualHumans });
  } catch (error) {
    logger.error('가상 휴먼 목록 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 특정 가상 휴먼 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getVirtualHumanById = async (req, res) => {
  try {
    const { virtualHumanId } = req.params;
    const userId = req.user.id;
    
    // 가상 휴먼 정보 조회
    const virtualHuman = await VirtualHuman.findById(virtualHumanId);
    
    if (!virtualHuman) {
      return res.status(404).json({ message: '가상 휴먼을 찾을 수 없습니다.' });
    }
    
    // 접근 권한 확인
    if (virtualHuman.owner.toString() !== userId && virtualHuman.settings.privacyMode === 'private') {
      return res.status(403).json({ message: '이 가상 휴먼에 접근할 권한이 없습니다.' });
    }
    
    res.status(200).json({ virtualHuman });
  } catch (error) {
    logger.error('가상 휴먼 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 가상 휴먼 업데이트
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const updateVirtualHuman = async (req, res) => {
  try {
    const { virtualHumanId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    
    // 보안을 위해 owner 필드 제거
    delete updateData.owner;
    delete updateData.createdAt;
    
    // 가상 휴먼 조회
    const virtualHuman = await VirtualHuman.findById(virtualHumanId);
    
    if (!virtualHuman) {
      return res.status(404).json({ message: '가상 휴먼을 찾을 수 없습니다.' });
    }
    
    // 소유자 확인
    if (virtualHuman.owner.toString() !== userId) {
      return res.status(403).json({ message: '이 가상 휴먼을 수정할 권한이 없습니다.' });
    }
    
    // 가상 휴먼 업데이트
    Object.keys(updateData).forEach(key => {
      virtualHuman[key] = updateData[key];
    });
    
    await virtualHuman.save();
    
    res.status(200).json({
      message: '가상 휴먼이 성공적으로 업데이트되었습니다.',
      virtualHuman
    });
    
    logger.info(`가상 휴먼 업데이트: ${virtualHumanId}`);
  } catch (error) {
    logger.error('가상 휴먼 업데이트 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 가상 휴먼 삭제
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const deleteVirtualHuman = async (req, res) => {
  try {
    const { virtualHumanId } = req.params;
    const userId = req.user.id;
    
    // 가상 휴먼 조회
    const virtualHuman = await VirtualHuman.findById(virtualHumanId);
    
    if (!virtualHuman) {
      return res.status(404).json({ message: '가상 휴먼을 찾을 수 없습니다.' });
    }
    
    // 소유자 확인
    if (virtualHuman.owner.toString() !== userId) {
      return res.status(403).json({ message: '이 가상 휴먼을 삭제할 권한이 없습니다.' });
    }
    
    // 사용자 정보에서 가상 휴먼 ID 제거
    await User.findByIdAndUpdate(userId, {
      $pull: { virtualHumans: virtualHumanId }
    });
    
    // 가상 휴먼 삭제
    await VirtualHuman.findByIdAndDelete(virtualHumanId);
    
    res.status(200).json({ message: '가상 휴먼이 성공적으로 삭제되었습니다.' });
    
    logger.info(`가상 휴먼 삭제: ${virtualHumanId}`);
  } catch (error) {
    logger.error('가상 휴먼 삭제 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 가상 휴먼과 대화
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const chatWithVirtualHuman = async (req, res) => {
  try {
    const { virtualHumanId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    
    // 필수 필드 확인
    if (!message) {
      return res.status(400).json({ message: '메시지 내용은 필수 항목입니다.' });
    }
    
    // 가상 휴먼 조회
    const virtualHuman = await VirtualHuman.findById(virtualHumanId);
    
    if (!virtualHuman) {
      return res.status(404).json({ message: '가상 휴먼을 찾을 수 없습니다.' });
    }
    
    // 접근 권한 확인
    if (virtualHuman.owner.toString() !== userId && virtualHuman.settings.privacyMode === 'private') {
      return res.status(403).json({ message: '이 가상 휴먼과 대화할 권한이 없습니다.' });
    }
    
    // 비활성 상태 확인
    if (!virtualHuman.isActive) {
      return res.status(400).json({ message: '이 가상 휴먼은 현재 비활성 상태입니다.' });
    }
    
    // LLM API를 사용하여 응답 생성
    const response = await processMessage(message, virtualHumanId);
    
    res.status(200).json({
      message: '가상 휴먼이 응답했습니다.',
      response,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`가상 휴먼 ${virtualHumanId}와의 대화 처리 완료`);
  } catch (error) {
    logger.error('가상 휴먼 대화 처리 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 가상 휴먼에게 작업 할당
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const assignTask = async (req, res) => {
  try {
    const { virtualHumanId } = req.params;
    const { title, description, priority, dueDate } = req.body;
    const userId = req.user.id;
    
    // 필수 필드 확인
    if (!title) {
      return res.status(400).json({ message: '작업 제목은 필수 항목입니다.' });
    }
    
    // 가상 휴먼 조회
    const virtualHuman = await VirtualHuman.findById(virtualHumanId);
    
    if (!virtualHuman) {
      return res.status(404).json({ message: '가상 휴먼을 찾을 수 없습니다.' });
    }
    
    // 소유자 확인
    if (virtualHuman.owner.toString() !== userId) {
      return res.status(403).json({ message: '이 가상 휴먼에게 작업을 할당할 권한이 없습니다.' });
    }
    
    // 비활성 상태 확인
    if (!virtualHuman.isActive) {
      return res.status(400).json({ message: '이 가상 휴먼은 현재 비활성 상태입니다.' });
    }
    
    // 작업 추가
    const taskData = {
      title,
      description: description || '',
      priority: priority || 'medium',
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : null
    };
    
    const updatedVirtualHuman = await virtualHuman.addTask(taskData);
    
    res.status(201).json({
      message: '작업이 성공적으로 할당되었습니다.',
      task: updatedVirtualHuman.tasks[updatedVirtualHuman.tasks.length - 1]
    });
    
    logger.info(`가상 휴먼 ${virtualHumanId}에게 새 작업 할당: ${title}`);
    
    // 작업을 비동기적으로 처리
    processTask(virtualHuman, updatedVirtualHuman.tasks[updatedVirtualHuman.tasks.length - 1]);
  } catch (error) {
    logger.error('작업 할당 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 가상 휴먼의 작업 목록 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getVirtualHumanTasks = async (req, res) => {
  try {
    const { virtualHumanId } = req.params;
    const userId = req.user.id;
    
    // 가상 휴먼 조회
    const virtualHuman = await VirtualHuman.findById(virtualHumanId);
    
    if (!virtualHuman) {
      return res.status(404).json({ message: '가상 휴먼을 찾을 수 없습니다.' });
    }
    
    // 접근 권한 확인
    if (virtualHuman.owner.toString() !== userId && virtualHuman.settings.privacyMode === 'private') {
      return res.status(403).json({ message: '이 가상 휴먼의 작업 목록에 접근할 권한이 없습니다.' });
    }
    
    res.status(200).json({ tasks: virtualHuman.tasks });
  } catch (error) {
    logger.error('작업 목록 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 가상 휴먼의 작업 처리 (비동기 함수)
 * @param {Object} virtualHuman - 가상 휴먼 객체
 * @param {Object} task - 작업 객체
 */
const processTask = async (virtualHuman, task) => {
  try {
    // 작업 상태 업데이트: 진행 중
    await virtualHuman.updateTaskStatus(task._id, 'in-progress');
    
    logger.info(`가상 휴먼 ${virtualHuman._id}가 작업 시작: ${task.title}`);
    
    // 작업 내용에 따라 처리 (여기서는 간단한 예시)
    // 실제 구현에서는 작업 유형에 따라 다양한 처리 로직 구현 필요
    const taskResult = await simulateTaskProcessing(virtualHuman, task);
    
    // 작업 완료 처리
    await virtualHuman.updateTaskStatus(task._id, 'completed', taskResult);
    
    logger.info(`가상 휴먼 ${virtualHuman._id}가 작업 완료: ${task.title}`);
  } catch (error) {
    logger.error(`작업 처리 중 오류 발생 (${virtualHuman._id}, ${task.title}):`, error);
    
    // 작업 실패 처리
    await virtualHuman.updateTaskStatus(task._id, 'failed', { error: error.message });
  }
};

/**
 * 작업 처리 시뮬레이션 (예시 함수)
 * @param {Object} virtualHuman - 가상 휴먼 객체
 * @param {Object} task - 작업 객체
 * @returns {Object} - 작업 결과
 */
const simulateTaskProcessing = async (virtualHuman, task) => {
  // 실제 환경에서는 여기에 작업 유형에 따른 다양한 처리 로직 구현
  // 현재는 지연 시간만 시뮬레이션
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // 작업에 따른 결과 생성
      const result = {
        status: 'success',
        completedAt: new Date(),
        summary: `작업 "${task.title}"이(가) 성공적으로 완료되었습니다.`,
        details: {}
      };
      
      resolve(result);
    }, 5000); // 5초 지연 (시뮬레이션)
  });
};

module.exports = {
  createVirtualHuman,
  getVirtualHumans,
  getVirtualHumanById,
  updateVirtualHuman,
  deleteVirtualHuman,
  chatWithVirtualHuman,
  assignTask,
  getVirtualHumanTasks
};
