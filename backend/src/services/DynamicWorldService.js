const DynamicWorld = require('../models/DynamicWorld');
const EmotionData = require('../models/EmotionData');
const User = require('../models/User');
const logger = require('../utils/logger');

class DynamicWorldService {
  constructor() {
    this.worldUpdateQueue = [];
    this.emotionAggregationInterval = null;
    this.ruleProcessingInterval = null;
    this.initializeWorldSystem();
  }

  /**
   * Initialize the dynamic world system
   */
  initializeWorldSystem() {
    // Process emotion aggregation every 30 seconds
    this.emotionAggregationInterval = setInterval(async () => {
      await this.processEmotionAggregation();
    }, 30 * 1000);

    // Process dynamic rules every minute
    this.ruleProcessingInterval = setInterval(async () => {
      await this.processDynamicRules();
    }, 60 * 1000);

    // Process world evolution every 5 minutes
    setInterval(async () => {
      await this.processWorldEvolution();
    }, 5 * 60 * 1000);
  }

  /**
   * Create a new dynamic world
   */
  async createWorld(creatorId, worldData) {
    try {
      const world = new DynamicWorld({
        name: worldData.name,
        description: worldData.description,
        worldType: worldData.worldType || 'hybrid',
        environment: this.initializeEnvironment(worldData.worldType),
        createdBy: creatorId,
        accessibility: {
          isPublic: worldData.isPublic !== false,
          permissions: {
            canBuild: true,
            canModifyEnvironment: creatorId === worldData.createdBy,
            canAddRules: creatorId === worldData.createdBy
          }
        }
      });

      // Add initial structures if provided
      if (worldData.initialStructures) {
        world.structures = worldData.initialStructures.map(structure => ({
          ...structure,
          id: this.generateStructureId(),
          creator: creatorId,
          createdAt: new Date()
        }));
      }

      // Add default dynamic rules
      world.dynamicRules = this.createDefaultRules(creatorId);

      await world.save();
      logger.info(`Created new dynamic world: ${world.name}`);
      return world;
    } catch (error) {
      logger.error('Error creating dynamic world:', error);
      throw error;
    }
  }

  /**
   * Initialize environment based on world type
   */
  initializeEnvironment(worldType) {
    const environments = {
      city: {
        weather: { type: 'sunny', temperature: 22, humidity: 60, windSpeed: 15 },
        atmosphere: {
          mood: 'energetic',
          colorPalette: {
            primary: '#1E88E5',
            secondary: '#FDD835',
            accent: '#E53935',
            background: '#ECEFF1'
          },
          ambientSound: 'urban',
          lightingIntensity: 0.8
        }
      },
      nature: {
        weather: { type: 'cloudy', temperature: 18, humidity: 70, windSpeed: 10 },
        atmosphere: {
          mood: 'peaceful',
          colorPalette: {
            primary: '#4CAF50',
            secondary: '#8BC34A',
            accent: '#FF9800',
            background: '#E8F5E9'
          },
          ambientSound: 'nature',
          lightingIntensity: 0.7
        }
      },
      abstract: {
        weather: { type: 'dynamic', temperature: 20, humidity: 50, windSpeed: 5 },
        atmosphere: {
          mood: 'mysterious',
          colorPalette: {
            primary: '#9C27B0',
            secondary: '#3F51B5',
            accent: '#00BCD4',
            background: '#212121'
          },
          ambientSound: 'abstract',
          lightingIntensity: 0.6
        }
      },
      hybrid: {
        weather: { type: 'dynamic', temperature: 20, humidity: 50, windSpeed: 12 },
        atmosphere: {
          mood: 'dynamic',
          colorPalette: {
            primary: '#2196F3',
            secondary: '#4CAF50',
            accent: '#FF5722',
            background: '#F5F5F5'
          },
          ambientSound: 'dynamic',
          lightingIntensity: 0.75
        }
      }
    };

    return environments[worldType] || environments.hybrid;
  }

  /**
   * Create default dynamic rules
   */
  createDefaultRules(creatorId) {
    return [
      {
        name: 'Emotion-Based Weather',
        description: 'Weather changes based on collective emotions',
        trigger: {
          type: 'emotion',
          condition: { emotionType: 'happiness', threshold: 0.7 }
        },
        effect: {
          target: 'environment',
          changes: {
            weather: { type: 'sunny', temperature: 25 }
          }
        },
        active: true,
        creator: creatorId
      },
      {
        name: 'Night Mode',
        description: 'Environment changes during night hours',
        trigger: {
          type: 'time',
          condition: { hours: [20, 21, 22, 23, 0, 1, 2, 3, 4, 5] }
        },
        effect: {
          target: 'atmosphere',
          changes: {
            lightingIntensity: 0.3,
            mood: 'peaceful'
          }
        },
        active: true,
        creator: creatorId
      },
      {
        name: 'Crowd Energy',
        description: 'Atmosphere becomes more energetic with more users',
        trigger: {
          type: 'population',
          condition: { minUsers: 10 }
        },
        effect: {
          target: 'atmosphere',
          changes: {
            mood: 'energetic',
            lightingIntensity: 0.9
          }
        },
        active: true,
        creator: creatorId
      }
    ];
  }

  /**
   * Generate unique structure ID
   */
  generateStructureId() {
    return `struct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add structure to world
   */
  async addStructure(worldId, structureData, creatorId) {
    try {
      const world = await DynamicWorld.findById(worldId);
      if (!world) {
        throw new Error('World not found');
      }

      // Check permissions
      if (!world.accessibility.isPublic && 
          !world.accessibility.allowedUsers.includes(creatorId) &&
          world.createdBy.toString() !== creatorId.toString()) {
        throw new Error('Permission denied');
      }

      const structure = {
        id: this.generateStructureId(),
        type: structureData.type,
        name: structureData.name,
        position: structureData.position,
        scale: structureData.scale || { x: 1, y: 1, z: 1 },
        rotation: structureData.rotation || { x: 0, y: 0, z: 0 },
        properties: structureData.properties || {},
        creator: creatorId,
        createdAt: new Date(),
        lastModified: new Date()
      };

      world.structures.push(structure);
      world.statistics.totalStructures = world.structures.length;
      
      // Record evolution
      world.evolutionHistory.push({
        timestamp: new Date(),
        changeType: 'structure',
        description: `Added ${structure.type}: ${structure.name}`,
        impact: 0.3,
        triggers: ['user_creation'],
        participantCount: 1
      });

      await world.save();
      
      logger.info(`Added structure to world ${worldId}`);
      return structure;
    } catch (error) {
      logger.error('Error adding structure:', error);
      throw error;
    }
  }

  /**
   * Process emotion aggregation for all active worlds
   */
  async processEmotionAggregation() {
    try {
      const activeWorlds = await DynamicWorld.find({
        'statistics.activeUsers': { $gt: 0 }
      });

      for (const world of activeWorlds) {
        await this.aggregateWorldEmotions(world);
      }
    } catch (error) {
      logger.error('Error processing emotion aggregation:', error);
    }
  }

  /**
   * Aggregate emotions for a specific world
   */
  async aggregateWorldEmotions(world) {
    try {
      // Get recent emotion data from users in this world
      const timeRange = {
        start: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        end: new Date()
      };

      // Get active users in the world (this would come from a session tracking system)
      // For now, we'll simulate with random emotion data
      const activeUserCount = world.statistics.activeUsers || 0;
      if (activeUserCount === 0) return;

      // Simulate emotion contributions
      const emotionContributions = [];
      for (let i = 0; i < Math.min(activeUserCount, 10); i++) {
        emotionContributions.push({
          userId: world.createdBy, // In real implementation, this would be actual user IDs
          contribution: Math.random() * 0.5 + 0.5
        });
      }

      await world.updateCollectiveEmotion(emotionContributions);
      logger.info(`Updated collective emotions for world ${world.name}`);
    } catch (error) {
      logger.error('Error aggregating world emotions:', error);
    }
  }

  /**
   * Process dynamic rules for all worlds
   */
  async processDynamicRules() {
    try {
      const worlds = await DynamicWorld.find({ 'dynamicRules.0': { $exists: true } });
      
      for (const world of worlds) {
        const rulesApplied = await world.applyDynamicRules();
        if (rulesApplied) {
          await world.save();
          logger.info(`Applied dynamic rules to world ${world.name}`);
        }
      }
    } catch (error) {
      logger.error('Error processing dynamic rules:', error);
    }
  }

  /**
   * Process world evolution based on activity and time
   */
  async processWorldEvolution() {
    try {
      const worlds = await DynamicWorld.find({});
      
      for (const world of worlds) {
        await this.evolveWorld(world);
      }
    } catch (error) {
      logger.error('Error processing world evolution:', error);
    }
  }

  /**
   * Evolve a world based on its activity and state
   */
  async evolveWorld(world) {
    try {
      const now = new Date();
      const evolutionFactors = [];

      // Calculate activity level
      const recentEvolutions = world.evolutionHistory.filter(
        e => now - e.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      );
      const activityLevel = recentEvolutions.length / 24; // Events per hour

      // Natural weather progression
      if (world.environment.weather.type === 'dynamic') {
        const weatherTypes = ['sunny', 'cloudy', 'rainy', 'foggy'];
        const currentIndex = weatherTypes.indexOf(world.environment.weather.type) || 0;
        const nextIndex = (currentIndex + 1) % weatherTypes.length;
        
        world.environment.weather.type = weatherTypes[nextIndex];
        evolutionFactors.push('weather_cycle');
      }

      // Time-based mood changes
      const hour = now.getHours();
      if (world.environment.atmosphere.mood === 'dynamic') {
        if (hour >= 6 && hour < 12) {
          world.environment.atmosphere.mood = 'energetic';
        } else if (hour >= 12 && hour < 18) {
          world.environment.atmosphere.mood = 'peaceful';
        } else if (hour >= 18 && hour < 22) {
          world.environment.atmosphere.mood = 'joyful';
        } else {
          world.environment.atmosphere.mood = 'mysterious';
        }
        evolutionFactors.push('time_based_mood');
      }

      // Structure-based evolution
      if (world.structures.length > 50) {
        world.worldType = 'city';
        evolutionFactors.push('urbanization');
      }

      // Update statistics
      world.statistics.evolutionRate = activityLevel;
      world.statistics.lastUpdated = now;

      // Record evolution if changes were made
      if (evolutionFactors.length > 0) {
        world.evolutionHistory.push({
          timestamp: now,
          changeType: 'environment',
          description: `Natural evolution: ${evolutionFactors.join(', ')}`,
          impact: 0.2,
          triggers: evolutionFactors,
          participantCount: world.statistics.activeUsers
        });

        await world.save();
        logger.info(`World ${world.name} evolved with factors: ${evolutionFactors.join(', ')}`);
      }
    } catch (error) {
      logger.error('Error evolving world:', error);
    }
  }

  /**
   * Get world by ID with full details
   */
  async getWorld(worldId) {
    return DynamicWorld.findById(worldId)
      .populate('createdBy', 'username')
      .populate('structures.creator', 'username')
      .populate('dynamicRules.creator', 'username');
  }

  /**
   * Update world settings
   */
  async updateWorld(worldId, updates, userId) {
    try {
      const world = await DynamicWorld.findById(worldId);
      if (!world) {
        throw new Error('World not found');
      }

      // Check permissions
      if (world.createdBy.toString() !== userId.toString()) {
        throw new Error('Only the creator can update world settings');
      }

      // Update allowed fields
      if (updates.name) world.name = updates.name;
      if (updates.description) world.description = updates.description;
      if (updates.accessibility) {
        Object.assign(world.accessibility, updates.accessibility);
      }

      world.updatedAt = new Date();
      await world.save();
      
      logger.info(`Updated world ${worldId}`);
      return world;
    } catch (error) {
      logger.error('Error updating world:', error);
      throw error;
    }
  }

  /**
   * Add a dynamic rule to a world
   */
  async addDynamicRule(worldId, ruleData, creatorId) {
    try {
      const world = await DynamicWorld.findById(worldId);
      if (!world) {
        throw new Error('World not found');
      }

      // Check permissions
      if (!world.accessibility.permissions.canAddRules && 
          world.createdBy.toString() !== creatorId.toString()) {
        throw new Error('Permission denied to add rules');
      }

      const rule = {
        name: ruleData.name,
        description: ruleData.description,
        trigger: ruleData.trigger,
        effect: ruleData.effect,
        active: true,
        creator: creatorId,
        createdAt: new Date()
      };

      world.dynamicRules.push(rule);
      await world.save();
      
      logger.info(`Added dynamic rule to world ${worldId}`);
      return rule;
    } catch (error) {
      logger.error('Error adding dynamic rule:', error);
      throw error;
    }
  }

  /**
   * Get active worlds list
   */
  async getActiveWorlds(limit = 10) {
    return DynamicWorld.find({
      'accessibility.isPublic': true,
      'statistics.activeUsers': { $gt: 0 }
    })
    .sort({ 'statistics.activeUsers': -1 })
    .limit(limit)
    .select('name description worldType statistics.activeUsers statistics.totalStructures createdBy');
  }

  /**
   * Join a world (increase active user count)
   */
  async joinWorld(worldId, userId) {
    try {
      const world = await DynamicWorld.findById(worldId);
      if (!world) {
        throw new Error('World not found');
      }

      // Check access permissions
      if (!world.accessibility.isPublic && 
          !world.accessibility.allowedUsers.includes(userId)) {
        throw new Error('Access denied to this world');
      }

      // Update statistics
      world.statistics.activeUsers += 1;
      world.statistics.totalVisitors += 1;
      await world.save();

      logger.info(`User ${userId} joined world ${worldId}`);
      return world;
    } catch (error) {
      logger.error('Error joining world:', error);
      throw error;
    }
  }

  /**
   * Leave a world (decrease active user count)
   */
  async leaveWorld(worldId, userId) {
    try {
      const world = await DynamicWorld.findById(worldId);
      if (!world) {
        throw new Error('World not found');
      }

      // Update statistics
      world.statistics.activeUsers = Math.max(0, world.statistics.activeUsers - 1);
      await world.save();

      logger.info(`User ${userId} left world ${worldId}`);
      return world;
    } catch (error) {
      logger.error('Error leaving world:', error);
      throw error;
    }
  }
}

module.exports = new DynamicWorldService();
