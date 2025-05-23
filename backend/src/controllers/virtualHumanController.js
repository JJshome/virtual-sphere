const VirtualHumanService = require('../services/VirtualHumanService');
const EmotionService = require('../services/EmotionService');
const logger = require('../utils/logger');

class VirtualHumanController {
  /**
   * Create a virtual human for the authenticated user
   */
  async createVirtualHuman(req, res) {
    try {
      const userId = req.user.id;
      const { name, personality, autonomyLevel } = req.body;

      const virtualHuman = await VirtualHumanService.createVirtualHuman(userId, {
        name,
        personality,
        autonomyLevel
      });

      res.status(201).json({
        success: true,
        data: virtualHuman,
        message: 'Virtual human created successfully'
      });
    } catch (error) {
      logger.error('Error creating virtual human:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create virtual human'
      });
    }
  }

  /**
   * Get the authenticated user's virtual human
   */
  async getMyVirtualHuman(req, res) {
    try {
      const userId = req.user.id;
      const virtualHuman = await VirtualHumanService.getVirtualHuman(userId);

      if (!virtualHuman) {
        return res.status(404).json({
          success: false,
          error: 'Virtual human not found'
        });
      }

      res.json({
        success: true,
        data: virtualHuman
      });
    } catch (error) {
      logger.error('Error getting virtual human:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get virtual human'
      });
    }
  }

  /**
   * Update virtual human settings
   */
  async updateVirtualHuman(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const virtualHuman = await VirtualHumanService.updateVirtualHuman(userId, updates);

      res.json({
        success: true,
        data: virtualHuman,
        message: 'Virtual human updated successfully'
      });
    } catch (error) {
      logger.error('Error updating virtual human:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update virtual human'
      });
    }
  }

  /**
   * Get virtual human activities
   */
  async getActivities(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, type } = req.query;

      const virtualHuman = await VirtualHumanService.getVirtualHuman(userId);
      if (!virtualHuman) {
        return res.status(404).json({
          success: false,
          error: 'Virtual human not found'
        });
      }

      let activities = virtualHuman.activities;
      
      // Filter by type if specified
      if (type) {
        activities = activities.filter(activity => activity.type === type);
      }

      // Limit results
      activities = activities.slice(-limit);

      res.json({
        success: true,
        data: activities,
        total: activities.length
      });
    } catch (error) {
      logger.error('Error getting activities:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get activities'
      });
    }
  }

  /**
   * Get virtual human relationships
   */
  async getRelationships(req, res) {
    try {
      const userId = req.user.id;
      const virtualHuman = await VirtualHumanService.getVirtualHuman(userId);

      if (!virtualHuman) {
        return res.status(404).json({
          success: false,
          error: 'Virtual human not found'
        });
      }

      res.json({
        success: true,
        data: virtualHuman.relationships,
        total: virtualHuman.relationships.length
      });
    } catch (error) {
      logger.error('Error getting relationships:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get relationships'
      });
    }
  }

  /**
   * Get virtual human emotional state
   */
  async getEmotionalState(req, res) {
    try {
      const userId = req.user.id;
      const virtualHuman = await VirtualHumanService.getVirtualHuman(userId);

      if (!virtualHuman) {
        return res.status(404).json({
          success: false,
          error: 'Virtual human not found'
        });
      }

      res.json({
        success: true,
        data: {
          current: virtualHuman.emotionalState.current,
          history: virtualHuman.emotionalState.history.slice(-10) // Last 10 states
        }
      });
    } catch (error) {
      logger.error('Error getting emotional state:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get emotional state'
      });
    }
  }

  /**
   * Update virtual human emotional state
   */
  async updateEmotionalState(req, res) {
    try {
      const userId = req.user.id;
      const { emotionData } = req.body;

      // Process emotion data
      const processedEmotion = await EmotionService.processEmotionData(userId, emotionData);

      res.json({
        success: true,
        data: processedEmotion,
        message: 'Emotional state updated successfully'
      });
    } catch (error) {
      logger.error('Error updating emotional state:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update emotional state'
      });
    }
  }

  /**
   * Get virtual human evolution history
   */
  async getEvolutionHistory(req, res) {
    try {
      const userId = req.user.id;
      const virtualHuman = await VirtualHumanService.getVirtualHuman(userId);

      if (!virtualHuman) {
        return res.status(404).json({
          success: false,
          error: 'Virtual human not found'
        });
      }

      res.json({
        success: true,
        data: virtualHuman.evolutionHistory,
        total: virtualHuman.evolutionHistory.length
      });
    } catch (error) {
      logger.error('Error getting evolution history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get evolution history'
      });
    }
  }

  /**
   * Trigger virtual human evolution
   */
  async evolve(req, res) {
    try {
      const userId = req.user.id;
      const { changes, trigger } = req.body;

      const virtualHuman = await VirtualHumanService.getVirtualHuman(userId);
      if (!virtualHuman) {
        return res.status(404).json({
          success: false,
          error: 'Virtual human not found'
        });
      }

      await virtualHuman.evolve(changes, trigger);

      res.json({
        success: true,
        data: virtualHuman,
        message: 'Virtual human evolved successfully'
      });
    } catch (error) {
      logger.error('Error evolving virtual human:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to evolve virtual human'
      });
    }
  }

  /**
   * Deactivate virtual human
   */
  async deactivate(req, res) {
    try {
      const userId = req.user.id;
      const virtualHuman = await VirtualHumanService.deactivateVirtualHuman(userId);

      res.json({
        success: true,
        data: virtualHuman,
        message: 'Virtual human deactivated successfully'
      });
    } catch (error) {
      logger.error('Error deactivating virtual human:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to deactivate virtual human'
      });
    }
  }

  /**
   * Reactivate virtual human
   */
  async reactivate(req, res) {
    try {
      const userId = req.user.id;
      const virtualHuman = await VirtualHumanService.getVirtualHuman(userId);

      if (!virtualHuman) {
        return res.status(404).json({
          success: false,
          error: 'Virtual human not found'
        });
      }

      virtualHuman.isActive = true;
      await virtualHuman.save();

      // Reactivate in service
      VirtualHumanService.activateVirtualHuman(virtualHuman);

      res.json({
        success: true,
        data: virtualHuman,
        message: 'Virtual human reactivated successfully'
      });
    } catch (error) {
      logger.error('Error reactivating virtual human:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to reactivate virtual human'
      });
    }
  }

  /**
   * Get virtual human statistics
   */
  async getStatistics(req, res) {
    try {
      const userId = req.user.id;
      const virtualHuman = await VirtualHumanService.getVirtualHuman(userId);

      if (!virtualHuman) {
        return res.status(404).json({
          success: false,
          error: 'Virtual human not found'
        });
      }

      const stats = {
        personality: virtualHuman.personality,
        skillLevels: virtualHuman.learningProfile.skills.reduce((acc, skill) => {
          acc[skill.name] = skill.level;
          return acc;
        }, {}),
        totalActivities: virtualHuman.activities.length,
        autonomousActivities: virtualHuman.activities.filter(a => a.autonomousAction).length,
        relationshipCount: virtualHuman.relationships.length,
        strongRelationships: virtualHuman.relationships.filter(r => r.strength > 0.7).length,
        evolutionCount: virtualHuman.evolutionHistory.length,
        currentEmotionalState: virtualHuman.emotionalState.current,
        lastActiveAt: virtualHuman.lastActiveAt
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get statistics'
      });
    }
  }
}

module.exports = new VirtualHumanController();
