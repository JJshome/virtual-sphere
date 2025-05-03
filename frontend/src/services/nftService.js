import api from './api';

/**
 * NFT 민팅
 * @param {Object} nftData - NFT 데이터
 * @returns {Promise} - 생성된 NFT 정보
 */
export const mintNFT = async (nftData) => {
  try {
    const response = await api.post('/nft/mint', nftData);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: 'NFT 민팅 중 오류가 발생했습니다.' };
  }
};

/**
 * 사용자 NFT 목록 조회
 * @returns {Promise} - 사용자의 NFT 목록
 */
export const getUserNFTs = async () => {
  try {
    const response = await api.get('/nft/my-nfts');
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: 'NFT 목록 조회 중 오류가 발생했습니다.' };
  }
};

/**
 * 특정 NFT 조회
 * @param {string} tokenId - NFT 토큰 ID
 * @returns {Promise} - NFT 정보
 */
export const getNFTById = async (tokenId) => {
  try {
    const response = await api.get(`/nft/${tokenId}`);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: 'NFT 조회 중 오류가 발생했습니다.' };
  }
};

/**
 * NFT 마켓플레이스 목록 조회
 * @param {Object} params - 조회 파라미터 (필터, 페이지 등)
 * @returns {Promise} - 마켓플레이스 NFT 목록
 */
export const getMarketplaceNFTs = async (params = {}) => {
  try {
    const response = await api.get('/nft/marketplace', { params });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: '마켓플레이스 NFT 조회 중 오류가 발생했습니다.' };
  }
};

/**
 * NFT 판매 등록
 * @param {string} tokenId - NFT 토큰 ID
 * @param {number} price - 판매 가격
 * @param {string} currency - 통화 (기본값: 'ETH')
 * @returns {Promise} - 판매 등록 결과
 */
export const listNFTForSale = async (tokenId, price, currency = 'ETH') => {
  try {
    const response = await api.post(`/nft/${tokenId}/list`, { price, currency });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: 'NFT 판매 등록 중 오류가 발생했습니다.' };
  }
};

/**
 * NFT 구매
 * @param {string} tokenId - NFT 토큰 ID
 * @returns {Promise} - 구매 결과
 */
export const buyNFT = async (tokenId) => {
  try {
    const response = await api.post(`/nft/${tokenId}/buy`);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: 'NFT 구매 중 오류가 발생했습니다.' };
  }
};

/**
 * NFT 거래 내역 조회
 * @param {Object} params - 조회 파라미터 (토큰 ID 등)
 * @returns {Promise} - 거래 내역
 */
export const getNFTTransactions = async (params = {}) => {
  try {
    const response = await api.get('/nft/transactions', { params });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: 'NFT 거래 내역 조회 중 오류가 발생했습니다.' };
  }
};
