const mongoose = require('mongoose');

const DynamicWorldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  worldType: {
    type: String,
    enum: ['city', 'nature', 'abstract', 'hybrid', 'custom'],
    default: 'hybrid'
  },
  environment: {
    weather: {
      type: {
        type: String,
        enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'dynamic'],
        default: 'dynamic'
      },
      temperature: { type: Number, default: 20 }, // Celsius
      humidity: { type: Number, default: 50, min: 0, max: 100 },
      windSpeed: { type: Number, default: 10 }, // km/h
      timeOfDay: {
        type: String,
        enum: ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night', 'dynamic'],
        default: 'dynamic'
      }
    },
    atmosphere: {
      mood: {
        type: String,
        enum: ['peaceful', 'energetic', 'mysterious', 'tense', 'joyful', 'melancholic', 'dynamic'],
        default: 'dynamic'
      },
      colorPalette: {
        primary: { type: String, default: '#4A90E2' },
        secondary: { type: String, default: '#50E3C2' },
        accent: { type: String, default: '#F5A623' },
        background: { type: String, default: '#F8F8F8' }
      },
      ambientSound: {
        type: String,
        enum: ['nature', 'urban', 'abstract', 'music', 'silence', 'dynamic'],
        default: 'dynamic'
      },
      lightingIntensity: { type: Number, default: 0.7, min: 0, max: 1 }
    }
  },
  collectiveEmotionState: {
    dominant: {
      happiness: { type: Number, default: 0.5, min: 0, max: 1 },
      excitement: { type: Number, default: 0.5, min: 0, max: 1 },
      calmness: { type: Number, default: 0.5, min: 0, max: 1 },
      tension: { type: Number, default: 0.3, min: 0, max: 1 }
    },
    contributors: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      contribution: { type: Number, min: 0, max: 1 },
      timestamp: { type: Date, default: Date.now }
    }],
    lastCalculated: { type: Date, default: Date.now }
  },
  structures: [{
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['building', 'nature', 'art', 'infrastructure', 'interactive'],
      required: true
    },
    name: String,
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true }
    },
    scale: {
      x: { type: Number, default: 1 },
      y: { type: Number, default: 1 },
      z: { type: Number, default: 1 }
    },
    rotation: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 }
    },
    properties: mongoose.Schema.Types.Mixed,
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    lastModified: { type: Date, default: Date.now }
  }],
  dynamicRules: [{
    name: { type: String, required: true },
    description: String,
    trigger: {
      type: {
        type: String,
        enum: ['time', 'emotion', 'population', 'event', 'custom'],
        required: true
      },
      condition: mongoose.Schema.Types.Mixed
    },
    effect: {
      target: {
        type: String,
        enum: ['environment', 'structures', 'atmosphere', 'all'],
        required: true
      },
      changes: mongoose.Schema.Types.Mixed
    },
    active: { type: Boolean, default: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  collaborativeProjects: [{
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collaboration' },
    area: {
      center: { x: Number, y: Number, z: Number },
      radius: Number
    },
    status: {
      type: String,
      enum: ['planning', 'building', 'completed', 'archived'],
      default: 'planning'
    }
  }],
  evolutionHistory: [{
    timestamp: { type: Date, default: Date.now },
    changeType: {
      type: String,
      enum: ['environment', 'structure', 'rule', 'emotion', 'project']
    },
    description: String,
    impact: { type: Number, min: 0, max: 1 },
    triggers: [String],
    participantCount: Number
  }],
  statistics: {
    totalVisitors: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    totalStructures: { type: Number, default: 0 },
    collaborationScore: { type: Number, default: 0, min: 0, max: 100 },
    evolutionRate: { type: Number, default: 0 }, // Changes per day
    lastUpdated: { type: Date, default: Date.now }
  },
  accessibility: {
    isPublic: { type: Boolean, default: true },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    permissions: {
      canBuild: { type: Boolean, default: true },
      canModifyEnvironment: { type: Boolean, default: false },
      canAddRules: { type: Boolean, default: false }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Methods
DynamicWorldSchema.methods.updateCollectiveEmotion = async function(emotions) {
  const now = new Date();
  const decayFactor = 0.95; // Emotions decay over time
  
  // Apply decay to existing contributors based on time elapsed
  this.collectiveEmotionState.contributors = this.collectiveEmotionState.contributors
    .map(contrib => {
      const hoursElapsed = (now - contrib.timestamp) / (1000 * 60 * 60);
      const decay = Math.pow(decayFactor, hoursElapsed);
      return {
        ...contrib.toObject(),
        contribution: contrib.contribution * decay
      };
    })
    .filter(contrib => contrib.contribution > 0.01); // Remove negligible contributions
  
  // Add new emotions
  emotions.forEach(emotion => {
    const existingIndex = this.collectiveEmotionState.contributors
      .findIndex(c => c.userId.toString() === emotion.userId.toString());
    
    if (existingIndex >= 0) {
      this.collectiveEmotionState.contributors[existingIndex] = {
        userId: emotion.userId,
        contribution: emotion.contribution,
        timestamp: now
      };
    } else {
      this.collectiveEmotionState.contributors.push({
        userId: emotion.userId,
        contribution: emotion.contribution,
        timestamp: now
      });
    }
  });
  
  // Recalculate dominant emotion
  const totalContribution = this.collectiveEmotionState.contributors
    .reduce((sum, c) => sum + c.contribution, 0);
  
  if (totalContribution > 0) {
    // Reset dominant emotions
    Object.keys(this.collectiveEmotionState.dominant).forEach(key => {
      this.collectiveEmotionState.dominant[key] = 0;
    });
    
    // Calculate weighted average (implementation would include actual emotion data)
    // This is a simplified version
    this.collectiveEmotionState.dominant.happiness = 
      Math.random() * 0.3 + 0.5; // Placeholder calculation
    this.collectiveEmotionState.dominant.excitement = 
      Math.random() * 0.3 + 0.4;
    this.collectiveEmotionState.dominant.calmness = 
      1 - this.collectiveEmotionState.dominant.excitement;
    this.collectiveEmotionState.dominant.tension = 
      Math.random() * 0.2 + 0.2;
  }
  
  this.collectiveEmotionState.lastCalculated = now;
  
  // Trigger environment updates based on collective emotion
  await this.applyEmotionBasedChanges();
  
  return this.save();
};

DynamicWorldSchema.methods.applyEmotionBasedChanges = async function() {
  const emotions = this.collectiveEmotionState.dominant;
  
  // Update atmosphere based on collective emotions
  if (emotions.happiness > 0.7) {
    this.environment.atmosphere.mood = 'joyful';
    this.environment.atmosphere.lightingIntensity = 0.9;
  } else if (emotions.tension > 0.6) {
    this.environment.atmosphere.mood = 'tense';
    this.environment.atmosphere.lightingIntensity = 0.5;
  } else if (emotions.calmness > 0.7) {
    this.environment.atmosphere.mood = 'peaceful';
    this.environment.atmosphere.lightingIntensity = 0.7;
  }
  
  // Update weather based on collective emotions
  if (emotions.excitement > 0.7) {
    this.environment.weather.type = 'sunny';
    this.environment.weather.windSpeed = 20;
  } else if (emotions.tension > 0.6) {
    this.environment.weather.type = 'stormy';
    this.environment.weather.windSpeed = 40;
  }
  
  // Record evolution
  this.evolutionHistory.push({
    timestamp: new Date(),
    changeType: 'emotion',
    description: 'Environment updated based on collective emotions',
    impact: 0.5,
    triggers: ['collective_emotion_change'],
    participantCount: this.collectiveEmotionState.contributors.length
  });
  
  // Limit history size
  if (this.evolutionHistory.length > 1000) {
    this.evolutionHistory = this.evolutionHistory.slice(-1000);
  }
};

DynamicWorldSchema.methods.applyDynamicRules = async function() {
  const now = new Date();
  let changesApplied = false;
  
  for (const rule of this.dynamicRules) {
    if (!rule.active) continue;
    
    let shouldTrigger = false;
    
    // Check trigger conditions
    switch (rule.trigger.type) {
      case 'time':
        // Check if time condition is met
        const hours = now.getHours();
        if (rule.trigger.condition.hours && rule.trigger.condition.hours.includes(hours)) {
          shouldTrigger = true;
        }
        break;
      
      case 'emotion':
        // Check if emotion threshold is met
        const emotionType = rule.trigger.condition.emotionType;
        const threshold = rule.trigger.condition.threshold;
        if (this.collectiveEmotionState.dominant[emotionType] >= threshold) {
          shouldTrigger = true;
        }
        break;
      
      case 'population':
        // Check if population condition is met
        if (this.statistics.activeUsers >= rule.trigger.condition.minUsers) {
          shouldTrigger = true;
        }
        break;
    }
    
    if (shouldTrigger) {
      // Apply effects
      switch (rule.effect.target) {
        case 'environment':
          Object.assign(this.environment, rule.effect.changes);
          changesApplied = true;
          break;
        
        case 'atmosphere':
          Object.assign(this.environment.atmosphere, rule.effect.changes);
          changesApplied = true;
          break;
      }
    }
  }
  
  if (changesApplied) {
    this.evolutionHistory.push({
      timestamp: now,
      changeType: 'rule',
      description: 'Dynamic rules applied',
      impact: 0.3,
      triggers: ['rule_application'],
      participantCount: this.statistics.activeUsers
    });
  }
  
  return changesApplied;
};

// Indexes
DynamicWorldSchema.index({ name: 1 });
DynamicWorldSchema.index({ worldType: 1, 'accessibility.isPublic': 1 });
DynamicWorldSchema.index({ 'structures.creator': 1 });
DynamicWorldSchema.index({ 'collaborativeProjects.projectId': 1 });
DynamicWorldSchema.index({ createdBy: 1 });

module.exports = mongoose.model('DynamicWorld', DynamicWorldSchema);
