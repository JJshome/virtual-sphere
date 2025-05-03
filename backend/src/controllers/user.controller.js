const User = require('../models/User');
const VirtualHuman = require('../models/VirtualHuman');
const { logger } = require('../utils/logger');
const { findSimilarUsers } = require('../services/llm.service');

/**
 * 사용자 프로필 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 사용자 정보 조회
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('virtualHumans', 'name avatar personality description')
      .populate('projects', 'title description status');
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    logger.error('프로필 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 사용자 프로필 업데이트
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    // 보안을 위해 일부 필드 제거
    delete updateData.password;
    delete updateData.role;
    delete updateData.resetPasswordToken;
    delete updateData.resetPasswordExpires;
    
    // 이메일 변경 시 유효성 검사
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json({ message: '유효하지 않은 이메일 형식입니다.' });
      }
      
      // 이메일 중복 확인
      const existingEmail = await User.findOne({ 
        email: updateData.email,
        _id: { $ne: userId }
      });
      
      if (existingEmail) {
        return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
      }
    }
    
    // 사용자명 변경 시 유효성 검사
    if (updateData.username) {
      if (updateData.username.length < 3 || updateData.username.length > 30) {
        return res.status(400).json({ message: '사용자명은 3~30자 사이여야 합니다.' });
      }
      
      // 사용자명 중복 확인
      const existingUsername = await User.findOne({ 
        username: updateData.username,
        _id: { $ne: userId }
      });
      
      if (existingUsername) {
        return res.status(400).json({ message: '이미 사용 중인 사용자명입니다.' });
      }
    }
    
    // 사용자 정보 업데이트
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!updatedUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    res.status(200).json({
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: updatedUser
    });
    
    logger.info(`사용자 ${userId}의 프로필이 업데이트되었습니다.`);
  } catch (error) {
    logger.error('프로필 업데이트 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 사용자 관심사 업데이트
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const updateInterests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interests, goals, skills } = req.body;
    
    const updateData = {};
    
    if (interests) {
      updateData.interests = interests;
    }
    
    if (goals) {
      updateData.goals = goals;
    }
    
    if (skills) {
      updateData.skills = skills;
    }
    
    // 업데이트할 데이터가 없는 경우
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: '업데이트할 데이터가 없습니다.' });
    }
    
    // 사용자 정보 업데이트
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('interests goals skills');
    
    if (!updatedUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 가상 휴먼이 있는 경우, 가상 휴먼 정보도 업데이트
    if (interests || goals) {
      await updateVirtualHumansInterests(userId, updateData);
    }
    
    res.status(200).json({
      message: '관심사/목표/기술이 성공적으로 업데이트되었습니다.',
      user: updatedUser
    });
    
    logger.info(`사용자 ${userId}의 관심사/목표/기술이 업데이트되었습니다.`);
  } catch (error) {
    logger.error('관심사 업데이트 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 가상 휴먼의 관심사 업데이트 (Helper 함수)
 * @param {string} userId - 사용자 ID
 * @param {Object} updateData - 업데이트 데이터
 */
const updateVirtualHumansInterests = async (userId, updateData) => {
  try {
    // 사용자의 가상 휴먼 목록 조회
    const virtualHumans = await VirtualHuman.find({ owner: userId });
    
    if (virtualHumans.length === 0) {
      return;
    }
    
    // 각 가상 휴먼의 관심사/목표 일부 업데이트
    const updatePromises = virtualHumans.map(vh => {
      const vhUpdateData = {};
      
      // 관심사 업데이트 - 일부만 반영
      if (updateData.interests) {
        // 기존 관심사 유지하고 새 관심사 중 일부만 추가
        const currentInterests = new Set(vh.interests);
        const newInterests = updateData.interests.filter(i => !currentInterests.has(i));
        
        // 최대 2개의 새 관심사만 추가
        const interestsToAdd = newInterests.slice(0, 2);
        
        if (interestsToAdd.length > 0) {
          vhUpdateData.interests = [...vh.interests, ...interestsToAdd];
        }
      }
      
      // 목표 업데이트 - 일부만 반영
      if (updateData.goals) {
        // 기존 목표 유지하고 새 목표 중 일부만 추가
        const currentGoals = new Set(vh.goals);
        const newGoals = updateData.goals.filter(g => !currentGoals.has(g));
        
        // 최대 1개의 새 목표만 추가
        const goalsToAdd = newGoals.slice(0, 1);
        
        if (goalsToAdd.length > 0) {
          vhUpdateData.goals = [...vh.goals, ...goalsToAdd];
        }
      }
      
      // 업데이트할 데이터가 있는 경우에만 실행
      if (Object.keys(vhUpdateData).length > 0) {
        return VirtualHuman.findByIdAndUpdate(vh._id, { $set: vhUpdateData });
      }
      
      return Promise.resolve();
    });
    
    await Promise.all(updatePromises);
    logger.info(`사용자 ${userId}의 가상 휴먼 관심사/목표가 업데이트되었습니다.`);
  } catch (error) {
    logger.error('가상 휴먼 관심사 업데이트 중 오류 발생:', error);
    // 실패해도 사용자 업데이트에 영향을 주지 않도록 오류를 catch하고 로깅만 수행
  }
};

/**
 * 추천 사용자 목록 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getRecommendedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;
    
    // 유사 사용자 찾기
    const similarUsers = await findSimilarUsers(userId, limit);
    
    res.status(200).json({ users: similarUsers });
  } catch (error) {
    logger.error('추천 사용자 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 특정 사용자 정보 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 사용자 정보 조회
    const user = await User.findById(userId)
      .select('username fullName profileImage bio interests goals skills status');
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 개인 정보 보호 설정 확인
    if (user.settings && user.settings.privacy && user.settings.privacy.profileVisibility === 'private') {
      // 해당 사용자의 기본 정보만 반환
      return res.status(200).json({
        user: {
          _id: user._id,
          username: user.username,
          profileImage: user.profileImage,
          status: user.status
        },
        message: '이 사용자의 프로필은 비공개로 설정되어 있습니다.'
      });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    logger.error('사용자 정보 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 사용자 검색
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!query) {
      return res.status(400).json({ message: '검색어를 입력해주세요.' });
    }
    
    // 사용자 검색
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { interests: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username fullName profileImage bio interests status')
    .limit(limit);
    
    res.status(200).json({ users });
  } catch (error) {
    logger.error('사용자 검색 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateInterests,
  getRecommendedUsers,
  getUserById,
  searchUsers
};
