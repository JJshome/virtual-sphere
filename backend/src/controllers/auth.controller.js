const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

/**
 * 회원가입 처리
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    // 필수 필드 확인
    if (!username || !email || !password) {
      return res.status(400).json({ message: '사용자명, 이메일, 비밀번호는 필수 입력 항목입니다.' });
    }
    
    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '유효하지 않은 이메일 형식입니다.' });
    }
    
    // 사용자명 중복 확인
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: '이미 사용 중인 사용자명입니다.' });
    }
    
    // 이메일 중복 확인
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }
    
    // 비밀번호 유효성 검사
    if (password.length < 6) {
      return res.status(400).json({ message: '비밀번호는 최소 6자 이상이어야 합니다.' });
    }
    
    // 새 사용자 생성
    const newUser = new User({
      username,
      email,
      password, // pre('save') 훅에서 해시화됨
      fullName: fullName || '',
      interests: [],
      goals: [],
      skills: []
    });
    
    // 사용자 저장
    await newUser.save();
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );
    
    // 비밀번호 제외하고 응답
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role
    };
    
    res.status(201).json({
      message: '회원가입이 성공적으로 완료되었습니다.',
      user: userResponse,
      token
    });
    
    logger.info(`새 사용자 등록 완료: ${username} (${email})`);
  } catch (error) {
    logger.error('회원가입 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 로그인 처리
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 필수 필드 확인
    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호는 필수 입력 항목입니다.' });
    }
    
    // 사용자 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );
    
    // 상태 업데이트
    user.status = 'online';
    user.lastActive = new Date();
    await user.save();
    
    // 비밀번호 제외하고 응답
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      profileImage: user.profileImage,
      role: user.role,
      virtualHumans: user.virtualHumans,
      interests: user.interests,
      goals: user.goals
    };
    
    res.status(200).json({
      message: '로그인에 성공했습니다.',
      user: userResponse,
      token
    });
    
    logger.info(`사용자 로그인: ${user.username}`);
  } catch (error) {
    logger.error('로그인 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 로그아웃 처리
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const logout = async (req, res) => {
  try {
    // 사용자 ID 가져오기
    const userId = req.user.id;
    
    // 사용자 상태 업데이트
    await User.findByIdAndUpdate(userId, { status: 'offline' });
    
    res.status(200).json({ message: '로그아웃되었습니다.' });
    
    logger.info(`사용자 로그아웃: ${req.user.username}`);
  } catch (error) {
    logger.error('로그아웃 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 현재 사용자 정보 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 사용자 정보 조회
    const user = await User.findById(userId)
      .select('-password')
      .populate('virtualHumans', 'name avatar personality description')
      .populate('projects', 'title description status');
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    logger.error('사용자 정보 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 비밀번호 변경
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // 필수 필드 확인
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호는 필수 입력 항목입니다.' });
    }
    
    // 비밀번호 길이 확인
    if (newPassword.length < 6) {
      return res.status(400).json({ message: '새 비밀번호는 최소 6자 이상이어야 합니다.' });
    }
    
    // 사용자 찾기
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 현재 비밀번호 확인
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
    }
    
    // 새 비밀번호 설정
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
    
    logger.info(`사용자 ${user.username}의 비밀번호가 변경되었습니다.`);
  } catch (error) {
    logger.error('비밀번호 변경 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 비밀번호 재설정 요청
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: '이메일은 필수 입력 항목입니다.' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      // 보안을 위해 사용자가 없어도 성공 응답
      return res.status(200).json({ message: '비밀번호 재설정 안내가 이메일로 전송되었습니다.' });
    }
    
    // 토큰 생성
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1시간
    
    // 토큰 저장
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    
    // 이메일 전송 (실제 구현 필요)
    // TODO: 이메일 서비스 연동
    
    res.status(200).json({ message: '비밀번호 재설정 안내가 이메일로 전송되었습니다.' });
    
    logger.info(`비밀번호 재설정 요청: ${email}`);
  } catch (error) {
    logger.error('비밀번호 재설정 요청 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 비밀번호 재설정
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: '토큰과 새 비밀번호는 필수 입력 항목입니다.' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: '새 비밀번호는 최소 6자 이상이어야 합니다.' });
    }
    
    // 토큰으로 사용자 찾기
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: '비밀번호 재설정 토큰이 유효하지 않거나 만료되었습니다.' });
    }
    
    // 비밀번호 업데이트
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.status(200).json({ message: '비밀번호가 성공적으로 재설정되었습니다.' });
    
    logger.info(`사용자 ${user.username}의 비밀번호가 재설정되었습니다.`);
  } catch (error) {
    logger.error('비밀번호 재설정 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword
};
