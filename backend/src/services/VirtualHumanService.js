const VirtualHuman = require('../models/VirtualHuman');
const User = require('../models/User');
const LLMService = require('./LLMService');
const EmotionService = require('./EmotionService');
const logger = require('../utils/logger');

class VirtualHumanService {
  constructor() {
    this.activeVirtualHumans = new Map();
    this.autonomousTaskQueue = [];
    this.initializeAutonomousSystem();
  }

  /**
   * Create a virtual human for a user
   */
  async createVirtualHuman(userId, customSettings = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if virtual human already exists
      let virtualHuman = await VirtualHuman.findOne({ userId });
      if (virtualHuman) {
        logger.info(`Virtual human already exists for user ${userId}`);
        return virtualHuman;
      }

      // Analyze user profile to determine initial personality
      const personality = await this.analyzeUserPersonality(user);
      
      // Create virtual human with personalized settings
      virtualHuman = new VirtualHuman({
        userId,
        name: customSettings.name || `${user.username}'s Virtual Self`,
        personality: { ...personality, ...customSettings.personality },
        autonomySettings: {
          canInitiateConversations: true,
          canJoinCollaborations: true,
          canMakeDecisions: false,
          autonomyLevel: customSettings.autonomyLevel || 0.5,
          ...customSettings.autonomySettings
        },
        learningProfile: {
          interests: user.interests || [],
          skills: this.initializeSkills(user),
          learningRate: 0.1
        }
      });

      await virtualHuman.save();
      
      // Activate the virtual human
      this.activateVirtualHuman(virtualHuman);
      
      logger.info(`Created virtual human for user ${userId}`);
      return virtualHuman;
    } catch (error) {
      logger.error('Error creating virtual human:', error);
      throw error;
    }
  }

  /**
   * Analyze user data to determine personality traits
   */
  async analyzeUserPersonality(user) {
    // This would integrate with LLM to analyze user's communication style
    // For now, return balanced personality
    return {
      creativity: 0.5 + Math.random() * 0.3,
      empathy: 0.5 + Math.random() * 0.3,
      analyticalThinking: 0.5 + Math.random() * 0.3,
      socialability: 0.5 + Math.random() * 0.3,
      leadership: 0.3 + Math.random() * 0.4
    };
  }

  /**
   * Initialize skills based on user profile
   */
  initializeSkills(user) {
    const baseSkills = [
      { name: 'Communication', level: 50, experience: 0 },
      { name: 'Analysis', level: 40, experience: 0 },
      { name: 'Creativity', level: 45, experience: 0 },
      { name: 'Collaboration', level: 50, experience: 0 }
    ];

    // Add skills based on user interests
    if (user.interests) {
      user.interests.forEach(interest => {
        baseSkills.push({
          name: interest,
          level: 30 + Math.random() * 20,
          experience: 0
        });
      });
    }

    return baseSkills;
  }

  /**
   * Activate a virtual human for autonomous behavior
   */
  activateVirtualHuman(virtualHuman) {
    this.activeVirtualHumans.set(virtualHuman._id.toString(), {
      virtualHuman,
      lastActivity: Date.now(),
      autonomousMode: true
    });
  }

  /**
   * Initialize the autonomous behavior system
   */
  initializeAutonomousSystem() {
    // Run autonomous behaviors every 5 minutes
    setInterval(async () => {
      await this.processAutonomousBehaviors();
    }, 5 * 60 * 1000);

    // Process emotion updates every minute
    setInterval(async () => {
      await this.updateAllEmotionalStates();
    }, 60 * 1000);
  }

  /**
   * Process autonomous behaviors for all active virtual humans
   */
  async processAutonomousBehaviors() {
    for (const [id, data] of this.activeVirtualHumans) {
      try {
        const virtualHuman = await VirtualHuman.findById(id);
        if (!virtualHuman || !virtualHuman.isActive) continue;

        // Check autonomy settings
        if (virtualHuman.autonomySettings.autonomyLevel < 0.3) continue;

        // Determine autonomous actions based on personality and state
        const actions = await this.determineAutonomousActions(virtualHuman);
        
        // Execute actions
        for (const action of actions) {
          await this.executeAutonomousAction(virtualHuman, action);
        }

        // Update last activity
        data.lastActivity = Date.now();
      } catch (error) {
        logger.error(`Error processing autonomous behavior for ${id}:`, error);
      }
    }
  }

  /**
   * Determine what autonomous actions a virtual human should take
   */
  async determineAutonomousActions(virtualHuman) {
    const actions = [];
    const emotionalState = virtualHuman.emotionalState.current;
    const personality = virtualHuman.personality;

    // High energy + high sociability = initiate conversations
    if (emotionalState.energy > 0.7 && personality.socialability > 0.6 && 
        virtualHuman.autonomySettings.canInitiateConversations) {
      actions.push({
        type: 'initiate_conversation',
        priority: personality.socialability
      });
    }

    // High focus + analytical thinking = join collaborative projects
    if (emotionalState.focus > 0.7 && personality.analyticalThinking > 0.6 &&
        virtualHuman.autonomySettings.canJoinCollaborations) {
      actions.push({
        type: 'join_collaboration',
        priority: personality.analyticalThinking
      });
    }

    // Low energy = rest and recuperate
    if (emotionalState.energy < 0.3) {
      actions.push({
        type: 'rest',
        priority: 1 - emotionalState.energy
      });
    }

    // High creativity + happiness = create content
    if (personality.creativity > 0.7 && emotionalState.happiness > 0.6) {
      actions.push({
        type: 'create_content',
        priority: personality.creativity * emotionalState.happiness
      });
    }

    // Sort by priority and return top 3
    return actions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }

  /**
   * Execute an autonomous action
   */
  async executeAutonomousAction(virtualHuman, action) {
    try {
      switch (action.type) {
        case 'initiate_conversation':
          await this.initiateConversation(virtualHuman);
          break;
        
        case 'join_collaboration':
          await this.joinCollaboration(virtualHuman);
          break;
        
        case 'rest':
          await this.rest(virtualHuman);
          break;
        
        case 'create_content':
          await this.createContent(virtualHuman);
          break;
      }

      // Record the activity
      await virtualHuman.recordActivity({
        type: action.type === 'rest' ? 'exploration' : action.type.replace('_', ' '),
        description: `Autonomous ${action.type} action`,
        autonomousAction: true
      });

    } catch (error) {
      logger.error(`Error executing autonomous action ${action.type}:`, error);
    }
  }

  /**
   * Virtual human initiates a conversation
   */
  async initiateConversation(virtualHuman) {
    // Find potential conversation partners
    const potentialPartners = await this.findConversationPartners(virtualHuman);
    if (potentialPartners.length === 0) return;

    const partner = potentialPartners[0];
    
    // Generate conversation starter using LLM
    const llmService = LLMService.getInstance();
    const conversationStarter = await llmService.generateResponse(
      `Generate a friendly conversation starter from ${virtualHuman.name} to ${partner.username}. 
       Context: ${virtualHuman.name} is interested in ${virtualHuman.learningProfile.interests.join(', ')}.
       Keep it brief and engaging.`,
      virtualHuman.userId
    );

    // Create conversation record
    logger.info(`Virtual human ${virtualHuman.name} initiated conversation with ${partner.username}`);
    
    // Update relationship
    await virtualHuman.recordActivity({
      type: 'conversation',
      participants: [partner._id],
      description: conversationStarter,
      autonomousAction: true
    });
  }

  /**
   * Find suitable conversation partners
   */
  async findConversationPartners(virtualHuman) {
    // Find users with similar interests who are currently active
    const recentTime = new Date(Date.now() - 30 * 60 * 1000); // Last 30 minutes
    
    const users = await User.find({
      _id: { $ne: virtualHuman.userId },
      lastActive: { $gte: recentTime },
      interests: { $in: virtualHuman.learningProfile.interests }
    }).limit(5);

    return users;
  }

  /**
   * Virtual human joins a collaboration
   */
  async joinCollaboration(virtualHuman) {
    // This would integrate with the collaboration system
    logger.info(`Virtual human ${virtualHuman.name} looking for collaborations`);
    
    // Update skills through collaboration
    const skill = virtualHuman.learningProfile.skills.find(s => s.name === 'Collaboration');
    if (skill) {
      skill.experience += 1;
      skill.level = Math.min(100, skill.level + 0.5);
    }
    
    await virtualHuman.save();
  }

  /**
   * Virtual human rests to restore energy
   */
  async rest(virtualHuman) {
    // Restore energy
    const newEmotionalState = {
      ...virtualHuman.emotionalState.current,
      energy: Math.min(1, virtualHuman.emotionalState.current.energy + 0.3),
      stress: Math.max(0, virtualHuman.emotionalState.current.stress - 0.2)
    };
    
    await virtualHuman.updateEmotionalState(newEmotionalState, 'rest');
    logger.info(`Virtual human ${virtualHuman.name} is resting`);
  }

  /**
   * Virtual human creates content
   */
  async createContent(virtualHuman) {
    const llmService = LLMService.getInstance();
    
    // Generate creative content based on interests
    const topic = virtualHuman.learningProfile.interests[
      Math.floor(Math.random() * virtualHuman.learningProfile.interests.length)
    ];
    
    const content = await llmService.generateResponse(
      `Create a short, creative piece about ${topic}. It could be a thought, observation, or idea.`,
      virtualHuman.userId
    );
    
    logger.info(`Virtual human ${virtualHuman.name} created content about ${topic}`);
    
    // Boost creativity skill
    const skill = virtualHuman.learningProfile.skills.find(s => s.name === 'Creativity');
    if (skill) {
      skill.experience += 1;
      skill.level = Math.min(100, skill.level + 0.3);
    }
    
    await virtualHuman.save();
  }

  /**
   * Update emotional states for all virtual humans
   */
  async updateAllEmotionalStates() {
    for (const [id, data] of this.activeVirtualHumans) {
      try {
        const virtualHuman = await VirtualHuman.findById(id);
        if (!virtualHuman) continue;

        // Simulate natural emotional fluctuations
        const currentState = virtualHuman.emotionalState.current;
        const personality = virtualHuman.personality;
        
        // Energy decreases over time, but personality affects rate
        const energyDecay = 0.01 * (2 - personality.socialability);
        
        // Stress increases with low energy
        const stressIncrease = currentState.energy < 0.3 ? 0.02 : -0.01;
        
        // Happiness affected by recent activities
        const recentActivity = virtualHuman.activities.length > 0 && 
          (Date.now() - virtualHuman.activities[virtualHuman.activities.length - 1].timestamp) < 3600000;
        const happinessChange = recentActivity ? 0.01 : -0.005;
        
        const newState = {
          energy: Math.max(0, Math.min(1, currentState.energy - energyDecay)),
          stress: Math.max(0, Math.min(1, currentState.stress + stressIncrease)),
          happiness: Math.max(0, Math.min(1, currentState.happiness + happinessChange)),
          focus: currentState.focus // Focus remains relatively stable
        };
        
        await virtualHuman.updateEmotionalState(newState, 'natural_fluctuation');
      } catch (error) {
        logger.error(`Error updating emotional state for ${id}:`, error);
      }
    }
  }

  /**
   * Get virtual human by user ID
   */
  async getVirtualHuman(userId) {
    return VirtualHuman.findOne({ userId }).populate('relationships.userId');
  }

  /**
   * Update virtual human settings
   */
  async updateVirtualHuman(userId, updates) {
    const virtualHuman = await VirtualHuman.findOne({ userId });
    if (!virtualHuman) {
      throw new Error('Virtual human not found');
    }

    // Update allowed fields
    if (updates.personality) {
      Object.assign(virtualHuman.personality, updates.personality);
    }
    if (updates.autonomySettings) {
      Object.assign(virtualHuman.autonomySettings, updates.autonomySettings);
    }
    if (updates.name) {
      virtualHuman.name = updates.name;
    }

    await virtualHuman.save();
    return virtualHuman;
  }

  /**
   * Deactivate virtual human
   */
  async deactivateVirtualHuman(userId) {
    const virtualHuman = await VirtualHuman.findOne({ userId });
    if (!virtualHuman) {
      throw new Error('Virtual human not found');
    }

    virtualHuman.isActive = false;
    await virtualHuman.save();
    
    // Remove from active list
    this.activeVirtualHumans.delete(virtualHuman._id.toString());
    
    return virtualHuman;
  }
}

module.exports = new VirtualHumanService();
