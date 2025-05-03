import api from './api';

/**
 * 사용자 프로필 정보 조회
 * @returns {Promise} - 사용자 프로필 정보
 */
export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: '프로필 정보 조회 중 오류가 발생했습니다.' };
  }
};

/**
 * 사용자 프로필 업데이트
 * @param {Object} profileData - 업데이트할 프로필 데이터
 * @returns {Promise} - 업데이트된 프로필 정보
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/users/profile', profileData);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: '프로필 업데이트 중 오류가 발생했습니다.' };
  }
};

/**
 * 사용자 관심사 업데이트
 * @param {Object} data - 관심사, 목표, 기술 데이터
 * @returns {Promise} - 업데이트된 정보
 */
export const updateUserInterests = async (data) => {
  try {
    const response = await api.put('/users/interests', data);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: '관심사 업데이트 중 오류가 발생했습니다.' };
  }
};

/**
 * 추천 사용자 목록 조회
 * @param {number} limit - 조회할 최대 개수
 * @returns {Promise} - 추천 사용자 목록
 */
export const getRecommendedUsers = async (limit = 5) => {
  try {
    const response = await api.get('/users/recommended', { params: { limit } });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: '추천 사용자 조회 중 오류가 발생했습니다.' };
  }
};

/**
 * 특정 사용자 정보 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise} - 사용자 정보
 */
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: '사용자 정보 조회 중 오류가 발생했습니다.' };
  }
};

/**
 * 사용자 검색
 * @param {string} query - 검색어
 * @param {number} limit - 최대 개수
 * @returns {Promise} - 검색 결과
 */
export const searchUsers = async (query, limit = 10) => {
  try {
    const response = await api.get('/users/search', { params: { query, limit } });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: '사용자 검색 중 오류가 발생했습니다.' };
  }
};
