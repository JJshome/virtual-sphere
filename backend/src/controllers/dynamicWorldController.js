const DynamicWorldService = require('../services/DynamicWorldService');
const logger = require('../utils/logger');

class DynamicWorldController {
  /**
   * Create a new dynamic world
   */
  async createWorld(req, res) {
    try {
      const userId = req.user.id;
      const worldData = req.body;

      const world = await DynamicWorldService.createWorld(userId, worldData);

      res.status(201).json({
        success: true,
        data: world,
        message: 'Dynamic world created successfully'
      });
    } catch (error) {
      logger.error('Error creating world:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create world'
      });
    }
  }

  /**
   * Get world by ID
   */
  async getWorld(req, res) {
    try {
      const { worldId } = req.params;
      const world = await DynamicWorldService.getWorld(worldId);

      if (!world) {
        return res.status(404).json({
          success: false,
          error: 'World not found'
        });
      }

      res.json({
        success: true,
        data: world
      });
    } catch (error) {
      logger.error('Error getting world:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get world'
      });
    }
  }

  /**
   * Update world settings
   */
  async updateWorld(req, res) {
    try {
      const userId = req.user.id;
      const { worldId } = req.params;
      const updates = req.body;

      const world = await DynamicWorldService.updateWorld(worldId, updates, userId);

      res.json({
        success: true,
        data: world,
        message: 'World updated successfully'
      });
    } catch (error) {
      logger.error('Error updating world:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update world'
      });
    }
  }

  /**
   * Get active worlds list
   */
  async getActiveWorlds(req, res) {
    try {
      const { limit = 10 } = req.query;
      const worlds = await DynamicWorldService.getActiveWorlds(parseInt(limit));

      res.json({
        success: true,
        data: worlds,
        total: worlds.length
      });
    } catch (error) {
      logger.error('Error getting active worlds:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get active worlds'
      });
    }
  }

  /**
   * Join a world
   */
  async joinWorld(req, res) {
    try {
      const userId = req.user.id;
      const { worldId } = req.params;

      const world = await DynamicWorldService.joinWorld(worldId, userId);

      res.json({
        success: true,
        data: world,
        message: 'Successfully joined world'
      });
    } catch (error) {
      logger.error('Error joining world:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to join world'
      });
    }
  }

  /**
   * Leave a world
   */
  async leaveWorld(req, res) {
    try {
      const userId = req.user.id;
      const { worldId } = req.params;

      const world = await DynamicWorldService.leaveWorld(worldId, userId);

      res.json({
        success: true,
        data: world,
        message: 'Successfully left world'
      });
    } catch (error) {
      logger.error('Error leaving world:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to leave world'
      });
    }
  }

  /**
   * Add structure to world
   */
  async addStructure(req, res) {
    try {
      const userId = req.user.id;
      const { worldId } = req.params;
      const structureData = req.body;

      const structure = await DynamicWorldService.addStructure(worldId, structureData, userId);

      res.status(201).json({
        success: true,
        data: structure,
        message: 'Structure added successfully'
      });
    } catch (error) {
      logger.error('Error adding structure:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add structure'
      });
    }
  }

  /**
   * Update structure in world
   */
  async updateStructure(req, res) {
    try {
      const userId = req.user.id;
      const { worldId, structureId } = req.params;
      const updates = req.body;

      const world = await DynamicWorldService.getWorld(worldId);
      if (!world) {
        return res.status(404).json({
          success: false,
          error: 'World not found'
        });
      }

      // Find and update structure
      const structureIndex = world.structures.findIndex(s => s.id === structureId);
      if (structureIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Structure not found'
        });
      }

      // Check permissions
      if (world.structures[structureIndex].creator.toString() !== userId &&
          world.createdBy.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Update structure
      Object.assign(world.structures[structureIndex], updates, {
        lastModified: new Date()
      });

      await world.save();

      res.json({
        success: true,
        data: world.structures[structureIndex],
        message: 'Structure updated successfully'
      });
    } catch (error) {
      logger.error('Error updating structure:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update structure'
      });
    }
  }

  /**
   * Delete structure from world
   */
  async deleteStructure(req, res) {
    try {
      const userId = req.user.id;
      const { worldId, structureId } = req.params;

      const world = await DynamicWorldService.getWorld(worldId);
      if (!world) {
        return res.status(404).json({
          success: false,
          error: 'World not found'
        });
      }

      // Find structure
      const structureIndex = world.structures.findIndex(s => s.id === structureId);
      if (structureIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Structure not found'
        });
      }

      // Check permissions
      if (world.structures[structureIndex].creator.toString() !== userId &&
          world.createdBy.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Remove structure
      world.structures.splice(structureIndex, 1);
      world.statistics.totalStructures = world.structures.length;

      // Record evolution
      world.evolutionHistory.push({
        timestamp: new Date(),
        changeType: 'structure',
        description: `Removed structure: ${structureId}`,
        impact: 0.2,
        triggers: ['user_deletion'],
        participantCount: 1
      });

      await world.save();

      res.json({
        success: true,
        message: 'Structure deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting structure:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete structure'
      });
    }
  }

  /**
   * Add dynamic rule to world
   */
  async addDynamicRule(req, res) {
    try {
      const userId = req.user.id;
      const { worldId } = req.params;
      const ruleData = req.body;

      const rule = await DynamicWorldService.addDynamicRule(worldId, ruleData, userId);

      res.status(201).json({
        success: true,
        data: rule,
        message: 'Dynamic rule added successfully'
      });
    } catch (error) {
      logger.error('Error adding dynamic rule:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add dynamic rule'
      });
    }
  }

  /**
   * Get world evolution history
   */
  async getEvolutionHistory(req, res) {
    try {
      const { worldId } = req.params;
      const { limit = 50 } = req.query;

      const world = await DynamicWorldService.getWorld(worldId);
      if (!world) {
        return res.status(404).json({
          success: false,
          error: 'World not found'
        });
      }

      const history = world.evolutionHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, parseInt(limit));

      res.json({
        success: true,
        data: history,
        total: world.evolutionHistory.length
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
   * Get world statistics
   */
  async getWorldStatistics(req, res) {
    try {
      const { worldId } = req.params;

      const world = await DynamicWorldService.getWorld(worldId);
      if (!world) {
        return res.status(404).json({
          success: false,
          error: 'World not found'
        });
      }

      const stats = {
        ...world.statistics,
        environment: {
          currentWeather: world.environment.weather.type,
          currentMood: world.environment.atmosphere.mood,
          lightingIntensity: world.environment.atmosphere.lightingIntensity
        },
        collectiveEmotion: {
          dominant: world.collectiveEmotionState.dominant,
          contributorCount: world.collectiveEmotionState.contributors.length,
          lastCalculated: world.collectiveEmotionState.lastCalculated
        },
        rules: {
          total: world.dynamicRules.length,
          active: world.dynamicRules.filter(r => r.active).length
        },
        structures: {
          total: world.structures.length,
          byType: world.structures.reduce((acc, struct) => {
            acc[struct.type] = (acc[struct.type] || 0) + 1;
            return acc;
          }, {})
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting world statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get world statistics'
      });
    }
  }

  /**
   * Update world emotion state
   */
  async updateCollectiveEmotion(req, res) {
    try {
      const userId = req.user.id;
      const { worldId } = req.params;
      const { emotionContribution } = req.body;

      const world = await DynamicWorldService.getWorld(worldId);
      if (!world) {
        return res.status(404).json({
          success: false,
          error: 'World not found'
        });
      }

      // Add user's emotion contribution
      await world.updateCollectiveEmotion([{
        userId,
        contribution: emotionContribution || 0.5
      }]);

      res.json({
        success: true,
        data: world.collectiveEmotionState,
        message: 'Collective emotion updated successfully'
      });
    } catch (error) {
      logger.error('Error updating collective emotion:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update collective emotion'
      });
    }
  }

  /**
   * Get user's worlds
   */
  async getUserWorlds(req, res) {
    try {
      const userId = req.user.id;
      const DynamicWorld = require('../models/DynamicWorld');

      const worlds = await DynamicWorld.find({
        $or: [
          { createdBy: userId },
          { 'accessibility.allowedUsers': userId }
        ]
      })
      .select('name description worldType statistics.activeUsers createdAt')
      .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: worlds,
        total: worlds.length
      });
    } catch (error) {
      logger.error('Error getting user worlds:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user worlds'
      });
    }
  }

  /**
   * Search worlds
   */
  async searchWorlds(req, res) {
    try {
      const { query, type, limit = 20 } = req.query;
      const DynamicWorld = require('../models/DynamicWorld');

      const searchQuery = {
        'accessibility.isPublic': true
      };

      if (query) {
        searchQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ];
      }

      if (type) {
        searchQuery.worldType = type;
      }

      const worlds = await DynamicWorld.find(searchQuery)
        .select('name description worldType statistics.activeUsers statistics.totalStructures createdBy createdAt')
        .populate('createdBy', 'username')
        .sort({ 'statistics.activeUsers': -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: worlds,
        total: worlds.length
      });
    } catch (error) {
      logger.error('Error searching worlds:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search worlds'
      });
    }
  }
}

module.exports = new DynamicWorldController();
