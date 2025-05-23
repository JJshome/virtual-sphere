const mongoose = require('mongoose');

const VirtualHumanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  personality: {
    creativity: { type: Number, default: 0.5, min: 0, max: 1 },
    empathy: { type: Number, default: 0.5, min: 0, max: 1 },
    analyticalThinking: { type: Number, default: 0.5, min: 0, max: 1 },
    socialability: { type: Number, default: 0.5, min: 0, max: 1 },
    leadership: { type: Number, default: 0.5, min: 0, max: 1 }
  },
  autonomySettings: {
    canInitiateConversations: { type: Boolean, default: true },
    canJoinCollaborations: { type: Boolean, default: true },
    canMakeDecisions: { type: Boolean, default: false },
    autonomyLevel: { type: Number, default: 0.5, min: 0, max: 1 }
  },
  learningProfile: {
    interests: [{ type: String }],
    skills: [{
      name: String,
      level: { type: Number, min: 0, max: 100 },
      experience: { type: Number, default: 0 }
    }],
    knowledgeGraph: { type: Map, of: mongoose.Schema.Types.Mixed },
    learningRate: { type: Number, default: 0.1, min: 0, max: 1 }
  },
  emotionalState: {
    current: {
      happiness: { type: Number, default: 0.5, min: 0, max: 1 },
      stress: { type: Number, default: 0.3, min: 0, max: 1 },
      energy: { type: Number, default: 0.8, min: 0, max: 1 },
      focus: { type: Number, default: 0.7, min: 0, max: 1 }
    },
    history: [{
      timestamp: Date,
      state: {
        happiness: Number,
        stress: Number,
        energy: Number,
        focus: Number
      },
      trigger: String
    }]
  },
  activities: [{
    type: {
      type: String,
      enum: ['conversation', 'collaboration', 'learning', 'creation', 'exploration']
    },
    timestamp: { type: Date, default: Date.now },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    description: String,
    outcome: mongoose.Schema.Types.Mixed,
    autonomousAction: { type: Boolean, default: false }
  }],
  relationships: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['friend', 'collaborator', 'mentor', 'mentee', 'acquaintance']
    },
    strength: { type: Number, default: 0.5, min: 0, max: 1 },
    interactions: { type: Number, default: 0 },
    lastInteraction: Date
  }],
  evolutionHistory: [{
    timestamp: { type: Date, default: Date.now },
    changes: mongoose.Schema.Types.Mixed,
    trigger: String,
    impact: { type: Number, min: 0, max: 1 }
  }],
  isActive: { type: Boolean, default: true },
  lastActiveAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Methods
VirtualHumanSchema.methods.updateEmotionalState = async function(newState, trigger) {
  // Add to history
  this.emotionalState.history.push({
    timestamp: new Date(),
    state: { ...this.emotionalState.current },
    trigger
  });
  
  // Update current state
  Object.assign(this.emotionalState.current, newState);
  
  // Keep history limited to last 100 entries
  if (this.emotionalState.history.length > 100) {
    this.emotionalState.history = this.emotionalState.history.slice(-100);
  }
  
  this.lastActiveAt = new Date();
  return this.save();
};

VirtualHumanSchema.methods.recordActivity = async function(activity) {
  this.activities.push(activity);
  
  // Update relationships if there are participants
  if (activity.participants && activity.participants.length > 0) {
    for (const participantId of activity.participants) {
      const relationshipIndex = this.relationships.findIndex(
        rel => rel.userId.toString() === participantId.toString()
      );
      
      if (relationshipIndex >= 0) {
        this.relationships[relationshipIndex].interactions++;
        this.relationships[relationshipIndex].lastInteraction = new Date();
        this.relationships[relationshipIndex].strength = Math.min(
          1,
          this.relationships[relationshipIndex].strength + 0.01
        );
      } else {
        this.relationships.push({
          userId: participantId,
          type: 'acquaintance',
          strength: 0.1,
          interactions: 1,
          lastInteraction: new Date()
        });
      }
    }
  }
  
  this.lastActiveAt = new Date();
  return this.save();
};

VirtualHumanSchema.methods.evolve = async function(changes, trigger) {
  // Record evolution
  const impact = this.calculateEvolutionImpact(changes);
  this.evolutionHistory.push({
    timestamp: new Date(),
    changes,
    trigger,
    impact
  });
  
  // Apply changes
  if (changes.personality) {
    Object.assign(this.personality, changes.personality);
  }
  if (changes.autonomySettings) {
    Object.assign(this.autonomySettings, changes.autonomySettings);
  }
  if (changes.learningProfile) {
    if (changes.learningProfile.interests) {
      this.learningProfile.interests = [
        ...new Set([...this.learningProfile.interests, ...changes.learningProfile.interests])
      ];
    }
    if (changes.learningProfile.skills) {
      // Update or add skills
      changes.learningProfile.skills.forEach(newSkill => {
        const existingSkill = this.learningProfile.skills.find(s => s.name === newSkill.name);
        if (existingSkill) {
          existingSkill.level = Math.min(100, existingSkill.level + (newSkill.level || 1));
          existingSkill.experience += newSkill.experience || 1;
        } else {
          this.learningProfile.skills.push(newSkill);
        }
      });
    }
  }
  
  this.updatedAt = new Date();
  return this.save();
};

VirtualHumanSchema.methods.calculateEvolutionImpact = function(changes) {
  let impact = 0;
  let factors = 0;
  
  // Calculate impact based on magnitude of changes
  if (changes.personality) {
    const personalityChanges = Object.values(changes.personality);
    impact += personalityChanges.reduce((sum, val) => sum + Math.abs(val), 0);
    factors += personalityChanges.length;
  }
  
  if (changes.autonomySettings) {
    impact += Math.abs(changes.autonomySettings.autonomyLevel || 0) * 2;
    factors += 1;
  }
  
  if (changes.learningProfile) {
    if (changes.learningProfile.interests) {
      impact += changes.learningProfile.interests.length * 0.1;
      factors += 1;
    }
    if (changes.learningProfile.skills) {
      impact += changes.learningProfile.skills.length * 0.2;
      factors += 1;
    }
  }
  
  return factors > 0 ? Math.min(1, impact / factors) : 0;
};

// Indexes
VirtualHumanSchema.index({ userId: 1 });
VirtualHumanSchema.index({ isActive: 1, lastActiveAt: -1 });
VirtualHumanSchema.index({ 'relationships.userId': 1 });
VirtualHumanSchema.index({ 'learningProfile.interests': 1 });

module.exports = mongoose.model('VirtualHuman', VirtualHumanSchema);
