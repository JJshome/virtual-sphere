const express = require('express');
const router = express.Router();
const emotionController = require('../controllers/emotionController');
const { auth } = require('../middlewares/auth');

// Emotion routes
router.post('/process', auth, emotionController.processEmotion);
router.get('/history', auth, emotionController.getEmotionHistory);
router.get('/analytics', auth, emotionController.getEmotionAnalytics);
router.get('/insights', auth, emotionController.getEmotionInsights);
router.delete('/:emotionId', auth, emotionController.deleteEmotionData);
router.post('/:emotionId/anonymize', auth, emotionController.anonymizeEmotionData);
router.put('/:emotionId/privacy', auth, emotionController.updatePrivacySettings);
router.get('/:emotionId/complexity', auth, emotionController.getEmotionalComplexity);

module.exports = router;
