const EmotionService = require('../services/EmotionService');
const logger = require('../utils/logger');

class EmotionController {
  /**
   * Process emotion data
   */
  async processEmotion(req, res) {
    try {
      const userId = req.user.id;
      const emotionInput = req.body;

      const emotionData = await EmotionService.processEmotionData(userId, emotionInput);

      res.status(201).json({
        success: true,
        data: emotionData,
        message: 'Emotion data processed successfully'
      });
    } catch (error) {
      logger.error('Error processing emotion:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process emotion data'
      });
    }
  }

  /**
   * Get emotion history
   */
  async getEmotionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      let timeRange;
      if (startDate || endDate) {
        timeRange = {
          start: startDate ? new Date(startDate) : new Date(0),
          end: endDate ? new Date(endDate) : new Date()
        };
      }

      const history = await EmotionService.getEmotionHistory(userId, timeRange);

      res.json({
        success: true,
        data: history,
        total: history.length
      });
    } catch (error) {
      logger.error('Error getting emotion history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get emotion history'
      });
    }
  }

  /**
   * Get emotion analytics
   */
  async getEmotionAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { period = '7d' } = req.query;

      const analytics = await EmotionService.getEmotionAnalytics(userId, period);

      if (!analytics) {
        return res.status(404).json({
          success: false,
          error: 'No emotion data found for the specified period'
        });
      }

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error getting emotion analytics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get emotion analytics'
      });
    }
  }

  /**
   * Delete emotion data (privacy)
   */
  async deleteEmotionData(req, res) {
    try {
      const userId = req.user.id;
      const { emotionId } = req.params;
      const EmotionData = require('../models/EmotionData');

      const emotionData = await EmotionData.findOne({
        _id: emotionId,
        userId
      });

      if (!emotionData) {
        return res.status(404).json({
          success: false,
          error: 'Emotion data not found'
        });
      }

      await emotionData.remove();

      res.json({
        success: true,
        message: 'Emotion data deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting emotion data:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete emotion data'
      });
    }
  }

  /**
   * Anonymize emotion data
   */
  async anonymizeEmotionData(req, res) {
    try {
      const userId = req.user.id;
      const { emotionId } = req.params;
      const EmotionData = require('../models/EmotionData');

      const emotionData = await EmotionData.findOne({
        _id: emotionId,
        userId
      });

      if (!emotionData) {
        return res.status(404).json({
          success: false,
          error: 'Emotion data not found'
        });
      }

      await emotionData.anonymize();

      res.json({
        success: true,
        message: 'Emotion data anonymized successfully'
      });
    } catch (error) {
      logger.error('Error anonymizing emotion data:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to anonymize emotion data'
      });
    }
  }

  /**
   * Get emotion insights
   */
  async getEmotionInsights(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;
      const EmotionData = require('../models/EmotionData');

      const recentData = await EmotionData.find({ userId })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .select('analysis.insights timestamp');

      const insights = recentData
        .flatMap(data => data.analysis.insights || [])
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, parseInt(limit));

      res.json({
        success: true,
        data: insights,
        total: insights.length
      });
    } catch (error) {
      logger.error('Error getting emotion insights:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get emotion insights'
      });
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(req, res) {
    try {
      const userId = req.user.id;
      const { emotionId } = req.params;
      const { sharingPermissions, dataRetentionDays } = req.body;
      const EmotionData = require('../models/EmotionData');

      const emotionData = await EmotionData.findOne({
        _id: emotionId,
        userId
      });

      if (!emotionData) {
        return res.status(404).json({
          success: false,
          error: 'Emotion data not found'
        });
      }

      if (sharingPermissions) {
        Object.assign(emotionData.privacy.sharingPermissions, sharingPermissions);
      }

      if (dataRetentionDays) {
        emotionData.privacy.dataRetentionDays = dataRetentionDays;
        // Update expiration date
        emotionData.expiresAt = new Date(
          emotionData.timestamp.getTime() + dataRetentionDays * 24 * 60 * 60 * 1000
        );
      }

      await emotionData.save();

      res.json({
        success: true,
        data: emotionData.privacy,
        message: 'Privacy settings updated successfully'
      });
    } catch (error) {
      logger.error('Error updating privacy settings:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update privacy settings'
      });
    }
  }

  /**
   * Get emotional complexity analysis
   */
  async getEmotionalComplexity(req, res) {
    try {
      const userId = req.user.id;
      const { emotionId } = req.params;
      const EmotionData = require('../models/EmotionData');

      const emotionData = await EmotionData.findOne({
        _id: emotionId,
        userId
      });

      if (!emotionData) {
        return res.status(404).json({
          success: false,
          error: 'Emotion data not found'
        });
      }

      const complexity = emotionData.calculateEmotionalComplexity();

      res.json({
        success: true,
        data: {
          complexity,
          emotionalBlend: emotionData.processedEmotion.emotionalBlend,
          primaryEmotion: emotionData.processedEmotion.primary,
          timestamp: emotionData.timestamp
        }
      });
    } catch (error) {
      logger.error('Error getting emotional complexity:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get emotional complexity'
      });
    }
  }
}

module.exports = new EmotionController();
