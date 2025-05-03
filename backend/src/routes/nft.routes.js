const express = require('express');
const router = express.Router();
const nftController = require('../controllers/nft.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// NFT 민팅
router.post('/mint', verifyToken, nftController.mintNFT);

// 사용자 NFT 목록 조회
router.get('/my-nfts', verifyToken, nftController.getUserNFTs);

// 특정 NFT 조회
router.get('/:tokenId', verifyToken, nftController.getNFTById);

// NFT 마켓플레이스 목록 조회
router.get('/marketplace', verifyToken, nftController.getMarketplaceNFTs);

// NFT 판매 등록
router.post('/:tokenId/list', verifyToken, nftController.listNFTForSale);

// NFT 구매
router.post('/:tokenId/buy', verifyToken, nftController.buyNFT);

// NFT 거래 내역 조회
router.get('/transactions', verifyToken, nftController.getNFTTransactions);

module.exports = router;
