const express = require('express');
const router = express.Router();
const emotionController = require('../controllers/emotionController');
const authMiddleware = require('../middlewares/authMiddleware');

// All emotion routes require authentication
router.use(authMiddleware);

// Process emotion data
router.post('/process', emotionController.processEmotion.bind(emotionController));

// Get emotion history
router.get('/history', emotionController.getEmotionHistory.bind(emotionController));

// Get emotion analytics
router.get('/analytics', emotionController.getEmotionAnalytics.bind(emotionController));

// Get emotion insights
router.get('/insights', emotionController.getEmotionInsights.bind(emotionController));

// Export emotion data
router.get('/export', emotionController.exportEmotionData.bind(emotionController));

// Delete specific emotion data
router.delete('/:emotionId', emotionController.deleteEmotionData.bind(emotionController));

// Anonymize specific emotion data
router.post('/:emotionId/anonymize', emotionController.anonymizeEmotionData.bind(emotionController));

// Update privacy settings
router.put('/:emotionId/privacy', emotionController.updatePrivacySettings.bind(emotionController));

// Get emotional complexity analysis
router.get('/:emotionId/complexity', emotionController.getEmotionalComplexity.bind(emotionController));

module.exports = router;
