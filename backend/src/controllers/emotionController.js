const emotionService = require('../services/emotionService');
const EmotionData = require('../models/EmotionData');
const logger = require('../utils/logger');

class EmotionController {
  // Process emotion data
  async processEmotion(req, res) {
    try {
      const userId = req.user.id;
      const emotionData = req.body;

      // Validate input
      if (!emotionData.dataType || !emotionData.rawData) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: dataType and rawData'
        });
      }

      // Process emotion
      const result = await emotionService.processEmotionData(userId, emotionData);

      res.status(200).json({
        success: true,
        data: result.data,
        insights: result.insights
      });
    } catch (error) {
      logger.error('Error processing emotion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process emotion data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get emotion history
  async getEmotionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate, limit = 50, skip = 0 } = req.query;

      const query = { userId };

      // Add date filters if provided
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const emotions = await EmotionData.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .select('-__v');

      const total = await EmotionData.countDocuments(query);

      res.status(200).json({
        success: true,
        data: emotions,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + emotions.length
        }
      });
    } catch (error) {
      logger.error('Error fetching emotion history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emotion history'
      });
    }
  }

  // Get emotion analytics
  async getEmotionAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { period = '7d' } = req.query;

      const analytics = await emotionService.getEmotionAnalytics(userId, period);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error fetching emotion analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emotion analytics'
      });
    }
  }

  // Get emotion insights
  async getEmotionInsights(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;

      // Get recent emotions with insights
      const emotions = await EmotionData.find({
        userId,
        insights: { $exists: true, $ne: [] }
      })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .select('insights timestamp');

      // Flatten and sort insights
      const allInsights = [];
      emotions.forEach(emotion => {
        emotion.insights.forEach(insight => {
          allInsights.push({
            ...insight.toObject(),
            emotionTimestamp: emotion.timestamp
          });
        });
      });

      // Sort by creation date and priority
      allInsights.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      res.status(200).json({
        success: true,
        data: allInsights.slice(0, parseInt(limit))
      });
    } catch (error) {
      logger.error('Error fetching emotion insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emotion insights'
      });
    }
  }

  // Delete emotion data
  async deleteEmotionData(req, res) {
    try {
      const userId = req.user.id;
      const { emotionId } = req.params;

      const emotion = await EmotionData.findOne({
        _id: emotionId,
        userId
      });

      if (!emotion) {
        return res.status(404).json({
          success: false,
          message: 'Emotion data not found'
        });
      }

      if (emotion.privacy.anonymized) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete anonymized data'
        });
      }

      await emotion.deleteOne();

      res.status(200).json({
        success: true,
        message: 'Emotion data deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting emotion data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete emotion data'
      });
    }
  }

  // Anonymize emotion data
  async anonymizeEmotionData(req, res) {
    try {
      const userId = req.user.id;
      const { emotionId } = req.params;

      const emotion = await EmotionData.findOne({
        _id: emotionId,
        userId
      });

      if (!emotion) {
        return res.status(404).json({
          success: false,
          message: 'Emotion data not found'
        });
      }

      if (emotion.privacy.anonymized) {
        return res.status(400).json({
          success: false,
          message: 'Data is already anonymized'
        });
      }

      await emotion.anonymize();

      res.status(200).json({
        success: true,
        message: 'Emotion data anonymized successfully',
        data: emotion
      });
    } catch (error) {
      logger.error('Error anonymizing emotion data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to anonymize emotion data'
      });
    }
  }

  // Update privacy settings
  async updatePrivacySettings(req, res) {
    try {
      const userId = req.user.id;
      const { emotionId } = req.params;
      const { shareLevel, dataRetentionDays } = req.body;

      const emotion = await EmotionData.findOne({
        _id: emotionId,
        userId
      });

      if (!emotion) {
        return res.status(404).json({
          success: false,
          message: 'Emotion data not found'
        });
      }

      if (emotion.privacy.anonymized) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update privacy settings for anonymized data'
        });
      }

      // Update privacy settings
      if (shareLevel) {
        emotion.privacy.shareLevel = shareLevel;
      }
      if (dataRetentionDays !== undefined) {
        emotion.privacy.dataRetentionDays = dataRetentionDays;
      }

      await emotion.save();

      res.status(200).json({
        success: true,
        message: 'Privacy settings updated successfully',
        data: emotion.privacy
      });
    } catch (error) {
      logger.error('Error updating privacy settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update privacy settings'
      });
    }
  }

  // Get emotional complexity
  async getEmotionalComplexity(req, res) {
    try {
      const userId = req.user.id;
      const { emotionId } = req.params;

      const emotion = await EmotionData.findOne({
        _id: emotionId,
        userId
      });

      if (!emotion) {
        return res.status(404).json({
          success: false,
          message: 'Emotion data not found'
        });
      }

      // Calculate detailed complexity metrics
      const complexityAnalysis = {
        overallComplexity: emotion.emotionalComplexity,
        emotionDiversity: this.calculateEmotionDiversity(emotion.emotions),
        dominantEmotions: this.getTopEmotions(emotion.emotions, 3),
        emotionalBalance: this.calculateEmotionalBalance(emotion.emotions),
        interpretation: this.interpretComplexity(emotion.emotionalComplexity)
      };

      res.status(200).json({
        success: true,
        data: complexityAnalysis
      });
    } catch (error) {
      logger.error('Error getting emotional complexity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get emotional complexity'
      });
    }
  }

  // Export user emotion data
  async exportEmotionData(req, res) {
    try {
      const userId = req.user.id;
      const { format = 'json', startDate, endDate } = req.query;

      const query = { userId };
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const emotions = await EmotionData.find(query)
        .sort({ timestamp: -1 });

      const exportedData = emotions.map(e => e.exportData());

      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(exportedData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=emotion_data.csv');
        res.send(csv);
      } else {
        res.status(200).json({
          success: true,
          data: exportedData,
          metadata: {
            totalRecords: exportedData.length,
            dateRange: {
              start: startDate || 'all',
              end: endDate || 'all'
            },
            exportDate: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      logger.error('Error exporting emotion data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export emotion data'
      });
    }
  }

  // Helper methods
  calculateEmotionDiversity(emotions) {
    const values = Object.values(emotions);
    const nonZeroCount = values.filter(v => v > 0.05).length;
    return nonZeroCount / Object.keys(emotions).length;
  }

  getTopEmotions(emotions, count = 3) {
    return Object.entries(emotions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([emotion, score]) => ({ emotion, score }));
  }

  calculateEmotionalBalance(emotions) {
    const positiveEmotions = ['happy', 'surprise'];
    const negativeEmotions = ['sad', 'angry', 'fear', 'disgust'];
    
    const positiveScore = positiveEmotions.reduce((sum, e) => sum + (emotions[e] || 0), 0);
    const negativeScore = negativeEmotions.reduce((sum, e) => sum + (emotions[e] || 0), 0);
    
    return {
      positive: positiveScore,
      negative: negativeScore,
      balance: positiveScore - negativeScore
    };
  }

  interpretComplexity(complexity) {
    if (complexity < 0.3) return 'Simple - Dominated by one or two emotions';
    if (complexity < 0.6) return 'Moderate - Mixed emotional state';
    if (complexity < 0.8) return 'Complex - Multiple competing emotions';
    return 'Very Complex - Highly mixed emotional state';
  }

  convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => {
      return Object.values(row).map(value => {
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value;
      }).join(',');
    });
    
    return [headers, ...rows].join('\n');
  }
}

module.exports = new EmotionController();
