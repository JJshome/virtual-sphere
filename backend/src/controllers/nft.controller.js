const NFT = require('../models/NFT');
const User = require('../models/User');
const VirtualHuman = require('../models/VirtualHuman');
const Project = require('../models/Project');
const { logger } = require('../utils/logger');
const Web3 = require('web3');

// Web3 설정
const web3 = new Web3(process.env.ETHEREUM_NODE_URL || 'https://mainnet.infura.io/v3/your_infura_project_id');

// NFT 스마트 계약 ABI (간소화된 예시)
const nftABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "string", "name": "tokenURI", "type": "string" }
    ],
    "name": "mintNFT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "address", "name": "recipient", "type": "address" }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// NFT 스마트 계약 인스턴스 생성
const nftContract = new web3.eth.Contract(
  nftABI,
  process.env.NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
);

/**
 * NFT 민팅
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const mintNFT = async (req, res) => {
  try {
    const { name, description, imageUrl, attributes, projectId, virtualHumanId } = req.body;
    const userId = req.user.id;
    
    // 필수 필드 확인
    if (!name || !description || !imageUrl) {
      return res.status(400).json({ message: 'NFT 이름, 설명, 이미지 URL은 필수 입력 항목입니다.' });
    }
    
    // 사용자 정보 조회
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 지갑 주소 확인
    if (!user.walletAddress) {
      return res.status(400).json({ message: 'NFT를 민팅하려면 지갑 주소가 필요합니다. 지갑 주소를 설정해주세요.' });
    }
    
    // 메타데이터 생성
    const metadata = {
      name,
      description,
      image: imageUrl,
      attributes: attributes || [],
      created_by: user.username,
      creation_date: new Date().toISOString()
    };
    
    // 프로젝트 연결 정보 추가
    if (projectId) {
      const project = await Project.findById(projectId);
      if (project) {
        // 프로젝트 멤버인지 확인
        const isMember = project.members.some(member => 
          member.user.toString() === userId
        );
        
        if (!isMember) {
          return res.status(403).json({ message: '이 프로젝트와 관련된 NFT를 민팅할 권한이 없습니다.' });
        }
        
        metadata.project = {
          id: project._id.toString(),
          title: project.title
        };
      }
    }
    
    // 가상 휴먼 연결 정보 추가
    if (virtualHumanId) {
      const virtualHuman = await VirtualHuman.findById(virtualHumanId);
      if (virtualHuman) {
        // 가상 휴먼 소유자인지 확인
        if (virtualHuman.owner.toString() !== userId) {
          return res.status(403).json({ message: '이 가상 휴먼과 관련된 NFT를 민팅할 권한이 없습니다.' });
        }
        
        metadata.virtual_human = {
          id: virtualHuman._id.toString(),
          name: virtualHuman.name
        };
      }
    }
    
    // IPFS에 메타데이터 업로드 (여기서는 시뮬레이션)
    const metadataUri = `ipfs://QmSimulatedHash/${Date.now()}`;
    
    // 블록체인에 NFT 민팅 (여기서는 시뮬레이션)
    const transactionHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const tokenId = Date.now().toString();
    
    // NFT 정보 저장
    const nft = new NFT({
      tokenId,
      name,
      description,
      owner: userId,
      creator: userId,
      imageUrl,
      metadata,
      attributes: attributes || [],
      contractAddress: process.env.NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      blockchain: 'ethereum',
      transactionHash,
      project: projectId,
      virtualHuman: virtualHumanId
    });
    
    // 초기 히스토리 추가
    nft.history.push({
      action: 'minted',
      from: '0x0000000000000000000000000000000000000000',
      to: user.walletAddress,
      transactionHash,
      timestamp: new Date()
    });
    
    await nft.save();
    
    // 사용자의 NFT 목록에 추가
    await User.findByIdAndUpdate(userId, {
      $push: { nfts: nft._id }
    });
    
    res.status(201).json({
      message: 'NFT가 성공적으로 민팅되었습니다.',
      nft
    });
    
    logger.info(`새 NFT 민팅: ${name} (${tokenId})`);
  } catch (error) {
    logger.error('NFT 민팅 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 사용자 NFT 목록 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getUserNFTs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // NFT 조회
    const nfts = await NFT.find({ owner: userId })
      .populate('project', 'title description')
      .populate('virtualHuman', 'name avatar');
    
    res.status(200).json({ nfts });
  } catch (error) {
    logger.error('NFT 목록 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 특정 NFT 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getNFTById = async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    // NFT 조회
    const nft = await NFT.findOne({ tokenId })
      .populate('owner', 'username fullName profileImage walletAddress')
      .populate('creator', 'username fullName profileImage')
      .populate('project', 'title description')
      .populate('virtualHuman', 'name avatar');
    
    if (!nft) {
      return res.status(404).json({ message: 'NFT를 찾을 수 없습니다.' });
    }
    
    res.status(200).json({ nft });
  } catch (error) {
    logger.error('NFT 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * NFT 마켓플레이스 목록 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getMarketplaceNFTs = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sortBy } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // 기본 쿼리: 판매 중인 NFT
    const query = { marketStatus: 'for_sale' };
    
    // 가격 범위 필터
    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.amount'].$lte = parseFloat(maxPrice);
    }
    
    // 카테고리 필터 (attributes 기반)
    if (category) {
      query.attributes = {
        $elemMatch: {
          trait_type: 'category',
          value: category
        }
      };
    }
    
    // 정렬 옵션
    let sort = {};
    if (sortBy === 'price-asc') {
      sort = { 'price.amount': 1 };
    } else if (sortBy === 'price-desc') {
      sort = { 'price.amount': -1 };
    } else if (sortBy === 'latest') {
      sort = { createdAt: -1 };
    } else {
      // 기본 정렬: 최신순
      sort = { createdAt: -1 };
    }
    
    // NFT 조회
    const nfts = await NFT.find(query)
      .populate('owner', 'username profileImage')
      .populate('creator', 'username')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // 총 NFT 수
    const total = await NFT.countDocuments(query);
    
    res.status(200).json({
      nfts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('마켓플레이스 NFT 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * NFT 판매 등록
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const listNFTForSale = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { price, currency } = req.body;
    const userId = req.user.id;
    
    // 필수 필드 확인
    if (!price || price <= 0) {
      return res.status(400).json({ message: '유효한 판매 가격을 입력해주세요.' });
    }
    
    // NFT 조회
    const nft = await NFT.findOne({ tokenId });
    
    if (!nft) {
      return res.status(404).json({ message: 'NFT를 찾을 수 없습니다.' });
    }
    
    // 소유자 확인
    if (nft.owner.toString() !== userId) {
      return res.status(403).json({ message: '이 NFT를 판매할 권한이 없습니다. NFT 소유자만 판매할 수 있습니다.' });
    }
    
    // 이미 판매 중인지 확인
    if (nft.marketStatus === 'for_sale') {
      return res.status(400).json({ message: '이 NFT는 이미 판매 중입니다.' });
    }
    
    // 판매 등록
    await nft.listForSale(price, currency || 'ETH');
    
    res.status(200).json({
      message: 'NFT가 성공적으로 판매 등록되었습니다.',
      nft
    });
    
    logger.info(`NFT 판매 등록: ${tokenId} (${price} ${currency || 'ETH'})`);
  } catch (error) {
    logger.error('NFT 판매 등록 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * NFT 구매
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const buyNFT = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const userId = req.user.id;
    
    // 사용자 정보 조회
    const buyer = await User.findById(userId);
    
    if (!buyer) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    // 지갑 주소 확인
    if (!buyer.walletAddress) {
      return res.status(400).json({ message: 'NFT를 구매하려면 지갑 주소가 필요합니다. 지갑 주소를 설정해주세요.' });
    }
    
    // NFT 조회
    const nft = await NFT.findOne({ tokenId });
    
    if (!nft) {
      return res.status(404).json({ message: 'NFT를 찾을 수 없습니다.' });
    }
    
    // 판매 중인지 확인
    if (nft.marketStatus !== 'for_sale') {
      return res.status(400).json({ message: '이 NFT는 현재 판매 중이 아닙니다.' });
    }
    
    // 자신의 NFT는 구매할 수 없음
    if (nft.owner.toString() === userId) {
      return res.status(400).json({ message: '자신의 NFT는 구매할 수 없습니다.' });
    }
    
    // 판매자 정보 조회
    const seller = await User.findById(nft.owner);
    
    if (!seller) {
      return res.status(404).json({ message: '판매자 정보를 찾을 수 없습니다.' });
    }
    
    // 블록체인에서 NFT 전송 (여기서는 시뮬레이션)
    const transactionHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    // NFT 소유자 변경
    const price = nft.price;
    const oldOwnerId = nft.owner;
    await nft.transfer(userId, price, transactionHash);
    
    // 사용자의 NFT 목록 업데이트
    await User.findByIdAndUpdate(oldOwnerId, {
      $pull: { nfts: nft._id }
    });
    
    await User.findByIdAndUpdate(userId, {
      $push: { nfts: nft._id }
    });
    
    res.status(200).json({
      message: 'NFT가 성공적으로 구매되었습니다.',
      nft,
      transaction: {
        price: nft.price,
        transactionHash
      }
    });
    
    logger.info(`NFT 구매: ${tokenId} (${price.amount} ${price.currency}) - 판매자: ${oldOwnerId}, 구매자: ${userId}`);
  } catch (error) {
    logger.error('NFT 구매 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * NFT 거래 내역 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
const getNFTTransactions = async (req, res) => {
  try {
    const { tokenId } = req.query;
    
    // 특정 NFT의 거래 내역 조회
    if (tokenId) {
      const nft = await NFT.findOne({ tokenId });
      
      if (!nft) {
        return res.status(404).json({ message: 'NFT를 찾을 수 없습니다.' });
      }
      
      return res.status(200).json({ transactions: nft.history });
    }
    
    // 모든 NFT 거래 내역 조회 (최근 50개)
    const nftTransactions = await NFT.aggregate([
      { $unwind: '$history' },
      { $sort: { 'history.timestamp': -1 } },
      { $limit: 50 },
      { $project: {
        tokenId: 1,
        name: 1,
        imageUrl: 1,
        transaction: '$history'
      }}
    ]);
    
    res.status(200).json({ transactions: nftTransactions });
  } catch (error) {
    logger.error('NFT 거래 내역 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = {
  mintNFT,
  getUserNFTs,
  getNFTById,
  getMarketplaceNFTs,
  listNFTForSale,
  buyNFT,
  getNFTTransactions
};
