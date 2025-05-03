const Project = require('../models/Project');
const User = require('../models/User');
const VirtualHuman = require('../models/VirtualHuman');
const { logger } = require('../utils/logger');
const { generateCollaborationProject, analyzeData } = require('../services/llm.service');

/**
 * 프로젝트 생성
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const createProject = async (req, res) => {
  try {
    const { title, description, category, tags, visibility, startDate, endDate, initialMembers } = req.body;
    const userId = req.user.id;
    
    // 필수 필드 확인
    if (!title || !description) {
      return res.status(400).json({ message: '프로젝트 제목과 설명은 필수 입력 항목입니다.' });
    }
    
    // 프로젝트 생성
    const project = new Project({
      title,
      description,
      creator: userId,
      category: category || 'other',
      tags: tags || [],
      visibility: visibility || 'private',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      status: 'planning'
    });
    
    // 초기 멤버 추가 (생성자는 자동으로 owner 역할로 추가됨)
    if (initialMembers && Array.isArray(initialMembers)) {
      for (const member of initialMembers) {
        // 이미 멤버인지 확인
        const existingMember = project.members.find(m => 
          m.user.toString() === member.userId
        );
        
        if (!existingMember && member.userId !== userId) {
          project.members.push({
            user: member.userId,
            role: member.role || 'member',
            joinedAt: new Date()
          });
        }
      }
    }
    
    // 프로젝트 저장
    await project.save();
    
    // 멤버들의 프로젝트 목록 업데이트
    const memberIds = project.members.map(member => member.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $push: { projects: project._id } }
    );
    
    res.status(201).json({
      message: '프로젝트가 성공적으로 생성되었습니다.',
      project
    });
    
    logger.info(`새 프로젝트 생성: ${title} (${project._id})`);
  } catch (error) {
    logger.error('프로젝트 생성 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 프로젝트 목록 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, category, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // 기본 쿼리: 멤버로 참여 중인 프로젝트
    const query = {
      'members.user': userId
    };
    
    // 상태 필터
    if (status) {
      query.status = status;
    }
    
    // 카테고리 필터
    if (category) {
      query.category = category;
    }
    
    // 검색어 필터
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 프로젝트 조회
    const projects = await Project.find(query)
      .populate('creator', 'username fullName profileImage')
      .populate('members.user', 'username fullName profileImage status')
      .populate('virtualHumans.virtualHuman', 'name avatar personality')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // 총 프로젝트 수
    const total = await Project.countDocuments(query);
    
    res.status(200).json({
      projects,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('프로젝트 목록 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 특정 프로젝트 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // 프로젝트 조회
    const project = await Project.findById(projectId)
      .populate('creator', 'username fullName profileImage')
      .populate('members.user', 'username fullName profileImage status')
      .populate('virtualHumans.virtualHuman', 'name avatar personality description')
      .populate('tasks.assignedTo', 'username name avatar');
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    
    // 접근 권한 확인
    const isMember = project.members.some(member => 
      member.user._id.toString() === userId
    );
    
    if (!isMember && project.visibility === 'private') {
      return res.status(403).json({ message: '이 프로젝트에 접근할 권한이 없습니다.' });
    }
    
    res.status(200).json({ project });
  } catch (error) {
    logger.error('프로젝트 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 프로젝트 업데이트
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    
    // 보안을 위해 일부 필드 제거
    delete updateData.creator;
    delete updateData.members;
    delete updateData.createdAt;
    
    // 프로젝트 조회
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    
    // 권한 확인
    const member = project.members.find(member => 
      member.user.toString() === userId
    );
    
    if (!member) {
      return res.status(403).json({ message: '이 프로젝트를 수정할 권한이 없습니다.' });
    }
    
    if (member.role !== 'owner' && member.role !== 'admin') {
      return res.status(403).json({ message: '프로젝트 수정 권한이 없습니다. 관리자 또는 소유자만 가능합니다.' });
    }
    
    // 프로젝트 업데이트
    Object.keys(updateData).forEach(key => {
      project[key] = updateData[key];
    });
    
    await project.save();
    
    res.status(200).json({
      message: '프로젝트가 성공적으로 업데이트되었습니다.',
      project
    });
    
    logger.info(`프로젝트 업데이트: ${projectId}`);
  } catch (error) {
    logger.error('프로젝트 업데이트 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 프로젝트 삭제
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // 프로젝트 조회
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    
    // 삭제 권한 확인 (소유자만 가능)
    const isOwner = project.members.some(member => 
      member.user.toString() === userId && member.role === 'owner'
    );
    
    if (!isOwner) {
      return res.status(403).json({ message: '이 프로젝트를 삭제할 권한이 없습니다. 프로젝트 소유자만 삭제할 수 있습니다.' });
    }
    
    // 모든 멤버의 프로젝트 목록에서 제거
    const memberIds = project.members.map(member => member.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { projects: projectId } }
    );
    
    // 모든 가상 휴먼의 프로젝트 목록에서 제거
    const virtualHumanIds = project.virtualHumans.map(vh => vh.virtualHuman);
    await VirtualHuman.updateMany(
      { _id: { $in: virtualHumanIds } },
      { $pull: { projects: projectId } }
    );
    
    // 프로젝트 삭제
    await Project.findByIdAndDelete(projectId);
    
    res.status(200).json({ message: '프로젝트가 성공적으로 삭제되었습니다.' });
    
    logger.info(`프로젝트 삭제: ${projectId}`);
  } catch (error) {
    logger.error('프로젝트 삭제 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 프로젝트에 멤버 추가
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;
    const requesterId = req.user.id;
    
    // 필수 필드 확인
    if (!userId) {
      return res.status(400).json({ message: '추가할 사용자 ID는 필수 항목입니다.' });
    }
    
    // 프로젝트 조회
    const project = await Project.findById(projectId)
      .populate('members.user', 'username');
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    
    // 권한 확인
    const requesterMember = project.members.find(member => 
      member.user._id.toString() === requesterId
    );
    
    if (!requesterMember || (requesterMember.role !== 'owner' && requesterMember.role !== 'admin')) {
      return res.status(403).json({ message: '멤버를 추가할 권한이 없습니다. 관리자 또는 소유자만 가능합니다.' });
    }
    
    // 이미 멤버인지 확인
    const existingMember = project.members.find(member => 
      member.user._id.toString() === userId
    );
    
    if (existingMember) {
      return res.status(400).json({ message: '이미 프로젝트에 참여 중인 사용자입니다.' });
    }
    
    // 추가할 사용자 확인
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: '추가할 사용자를 찾을 수 없습니다.' });
    }
    
    // 멤버 추가
    await project.addMember(userId, role || 'member');
    
    // 사용자의 프로젝트 목록에 추가
    await User.findByIdAndUpdate(userId, {
      $addToSet: { projects: projectId }
    });
    
    res.status(200).json({
      message: '멤버가 성공적으로 추가되었습니다.',
      member: {
        user: {
          _id: user._id,
          username: user.username
        },
        role: role || 'member',
        joinedAt: new Date()
      }
    });
    
    logger.info(`프로젝트 ${projectId}에 새 멤버 추가: ${userId}`);
  } catch (error) {
    logger.error('프로젝트 멤버 추가 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 프로젝트에서 멤버 제거
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const removeProjectMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const requesterId = req.user.id;
    
    // 프로젝트 조회
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    
    // 자기 자신은 소유자가 아닌 경우만 나갈 수 있음
    if (userId === requesterId) {
      const requesterMember = project.members.find(member => 
        member.user.toString() === requesterId
      );
      
      if (requesterMember && requesterMember.role === 'owner') {
        return res.status(400).json({ message: '프로젝트 소유자는 스스로 나갈 수 없습니다. 다른 멤버에게 소유권을 이전한 후 나가세요.' });
      }
    } else {
      // 다른 사용자를 제거하려면 권한 확인
      const requesterMember = project.members.find(member => 
        member.user.toString() === requesterId
      );
      
      if (!requesterMember || (requesterMember.role !== 'owner' && requesterMember.role !== 'admin')) {
        return res.status(403).json({ message: '멤버를 제거할 권한이 없습니다. 관리자 또는 소유자만 가능합니다.' });
      }
      
      // 소유자는 제거할 수 없음
      const targetMember = project.members.find(member => 
        member.user.toString() === userId
      );
      
      if (targetMember && targetMember.role === 'owner') {
        return res.status(400).json({ message: '프로젝트 소유자는 제거할 수 없습니다.' });
      }
    }
    
    // 멤버 제거
    await Project.findByIdAndUpdate(projectId, {
      $pull: { members: { user: userId } }
    });
    
    // 사용자의 프로젝트 목록에서 제거
    await User.findByIdAndUpdate(userId, {
      $pull: { projects: projectId }
    });
    
    res.status(200).json({ message: '멤버가 성공적으로 제거되었습니다.' });
    
    logger.info(`프로젝트 ${projectId}에서 멤버 제거: ${userId}`);
  } catch (error) {
    logger.error('프로젝트 멤버 제거 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 프로젝트에 가상 휴먼 추가
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const addVirtualHumanToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { virtualHumanId, role } = req.body;
    const userId = req.user.id;
    
    // 필수 필드 확인
    if (!virtualHumanId) {
      return res.status(400).json({ message: '추가할 가상 휴먼 ID는 필수 항목입니다.' });
    }
    
    // 프로젝트 조회
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    
    // 권한 확인
    const member = project.members.find(member => 
      member.user.toString() === userId
    );
    
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ message: '가상 휴먼을 추가할 권한이 없습니다. 관리자 또는 소유자만 가능합니다.' });
    }
    
    // 가상 휴먼 조회
    const virtualHuman = await VirtualHuman.findById(virtualHumanId);
    
    if (!virtualHuman) {
      return res.status(404).json({ message: '추가할 가상 휴먼을 찾을 수 없습니다.' });
    }
    
    // 가상 휴먼의 소유자 확인
    if (virtualHuman.owner.toString() !== userId) {
      return res.status(403).json({ message: '자신이 소유한 가상 휴먼만 프로젝트에 추가할 수 있습니다.' });
    }
    
    // 가상 휴먼 추가
    await project.addVirtualHuman(virtualHumanId, role || 'assistant');
    
    // 가상 휴먼의 프로젝트 목록에 추가
    await VirtualHuman.findByIdAndUpdate(virtualHumanId, {
      $addToSet: { projects: projectId }
    });
    
    res.status(200).json({
      message: '가상 휴먼이 성공적으로 추가되었습니다.',
      virtualHuman: {
        _id: virtualHuman._id,
        name: virtualHuman.name,
        avatar: virtualHuman.avatar,
        role: role || 'assistant'
      }
    });
    
    logger.info(`프로젝트 ${projectId}에 가상 휴먼 추가: ${virtualHumanId}`);
  } catch (error) {
    logger.error('가상 휴먼 추가 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 프로젝트 데이터 분석
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const analyzeProjectData = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { dataType, data } = req.body;
    const userId = req.user.id;
    
    // 필수 필드 확인
    if (!dataType || !data) {
      return res.status(400).json({ message: '분석할 데이터 유형과 데이터는 필수 항목입니다.' });
    }
    
    // 프로젝트 조회
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
    }
    
    // 권한 확인
    const isMember = project.members.some(member => 
      member.user.toString() === userId
    );
    
    if (!isMember) {
      return res.status(403).json({ message: '이 프로젝트의 데이터를 분석할 권한이 없습니다.' });
    }
    
    // 데이터 분석
    const analysisResult = await analyzeData({
      projectId,
      dataType,
      data
    });
    
    res.status(200).json({
      message: '데이터 분석이 완료되었습니다.',
      result: analysisResult
    });
    
    // 분석 결과 저장
    await Project.findByIdAndUpdate(projectId, {
      $set: { [`analytics.${dataType}`]: analysisResult },
      $push: {
        resources: {
          title: `${dataType} 분석 결과`,
          type: 'dataset',
          description: `${new Date().toISOString()} 분석 결과`,
          addedBy: userId,
          addedByModel: 'User',
          addedAt: new Date()
        }
      }
    });
    
    logger.info(`프로젝트 ${projectId} 데이터 분석 완료: ${dataType}`);
  } catch (error) {
    logger.error('프로젝트 데이터 분석 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 추천 프로젝트 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getRecommendedProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 사용자의 관심사와 태그가 일치하는 공개 프로젝트 찾기
    const interests = user.interests || [];
    const goals = user.goals || [];
    
    // 관심사나 목표가 없는 경우
    if (interests.length === 0 && goals.length === 0) {
      return res.status(200).json({ projects: [] });
    }
    
    // 쿼리 구성
    const query = {
      visibility: { $in: ['public', 'unlisted'] },
      // 아직 참여하지 않은 프로젝트만
      'members.user': { $ne: userId },
      // 관심사나 목표와 일치하는 태그가 있는 프로젝트
      $or: [
        { tags: { $in: interests } },
        { tags: { $in: goals } }
      ]
    };
    
    // 추천 프로젝트 조회
    const recommendedProjects = await Project.find(query)
      .select('title description category tags status progress')
      .populate('creator', 'username fullName profileImage')
      .limit(5);
    
    res.status(200).json({ projects: recommendedProjects });
  } catch (error) {
    logger.error('추천 프로젝트 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  addVirtualHumanToProject,
  analyzeProjectData,
  getRecommendedProjects
};
