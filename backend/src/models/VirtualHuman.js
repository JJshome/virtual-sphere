/**
 * Virtual Human Model - VirtualSphere System
 * 특허 구현: 가상 휴먼 에이전트 프로토콜 (Virtual Human Agent Protocol - VHAP)
 */

const mongoose = require('mongoose');

const VirtualHumanSchema = new mongoose.Schema({
  // Core Identification
  agentId: {
    type: String,
    required: true,
    unique: true,
    match: /^vh_[a-zA-Z0-9]+$/
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  llmInstanceId: {
    type: String,
    required: true,
    ref: 'LLMInstance'
  },
  
  // Patent Core: Virtual Human Profile
  profile: {
    name: { type: String, required: true },
    avatar: {
      style: { type: String, enum: ['realistic', 'cartoon', 'abstract'], default: 'realistic' },
      appearance: {
        gender: String,
        age: Number,
        hair: String,
        eyes: String,
        clothing: String
      },
      animations: [String],
      expressions: [String]
    },
    personality: {
      dominant: String,
      traits: [{
        name: String,
        intensity: { type: Number, min: 0, max: 1 }
      }],
      speechPattern: {
        formality: { type: Number, min: 0, max: 1 },
        enthusiasm: { type: Number, min: 0, max: 1 },
        directness: { type: Number, min: 0, max: 1 }
      }
    }
  },
  
  // Patent Core: Current State Management
  currentState: {
    type: String,
    enum: ['idle', 'active', 'working', 'socializing', 'learning', 'offline'],
    default: 'idle'
  },
  stateHistory: [{
    state: String,
    duration: Number,
    timestamp: { type: Date, default: Date.now },
    context: String
  }],
  
  // Patent Core: Autonomy Configuration
  autonomyLevel: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1,
    description: "0: Manual control, 1: Full autonomy"
  },
  autonomySettings: {
    canInitiateConversations: { type: Boolean, default: true },
    canJoinCollaborations: { type: Boolean, default: true },
    canMakeDecisions: { type: Boolean, default: false },
    canLearnFromInteractions: { type: Boolean, default: true },
    maxAutonomousActions: { type: Number, default: 10 }
  },
  
  // Patent Core: Task Queue System
  activeTaskQueue: [{
    taskId: String,
    type: { 
      type: String, 
      enum: ['conversation', 'collaboration', 'research', 'monitoring', 'analysis'] 
    },
    priority: { type: Number, default: 1, min: 1, max: 10 },
    status: { 
      type: String, 
      enum: ['pending', 'active', 'paused', 'completed', 'failed'], 
      default: 'pending' 
    },
    parameters: mongoose.Schema.Types.Mixed,
    scheduledFor: Date,
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
    result: mongoose.Schema.Types.Mixed
  }],
  
  // Patent Core: Interaction Capabilities
  interactionCapabilities: {
    supportedChannels: [{ 
      type: String, 
      enum: ['text', 'voice', 'video', 'gesture', 'emotion'] 
    }],
    languages: [String],
    domains: [{
      name: String,
      proficiency: { type: Number, min: 0, max: 1 }
    }],
    communicationStyles: [String],
    responsePatterns: [{
      trigger: String,
      response: String,
      context: [String]
    }]
  },
  
  // Patent Core: Evolution Parameters
  evolutionParameters: {
    learningRate: { type: Number, default: 0.1, min: 0, max: 1 },
    adaptationThreshold: { type: Number, default: 0.6, min: 0, max: 1 },
    personalityStability: { type: Number, default: 0.8, min: 0, max: 1 },
    memoryConsolidation: { type: Number, default: 0.7, min: 0, max: 1 },
    socialLearning: { type: Number, default: 0.5, min: 0, max: 1 }
  },
  
  // Social Network Data
  relationships: [{
    targetId: String,
    targetType: { type: String, enum: ['user', 'virtual_human'] },
    relationshipType: { 
      type: String, 
      enum: ['friend', 'collaborator', 'mentor', 'mentee', 'acquaintance'] 
    },
    strength: { type: Number, default: 0.5, min: 0, max: 1 },
    interactionCount: { type: Number, default: 0 },
    lastInteraction: Date,
    sharedInterests: [String]
  }],
  
  // Experience & Memory
  experiences: [{
    type: { type: String, enum: ['interaction', 'collaboration', 'learning', 'achievement'] },
    description: String,
    participants: [String],
    outcome: String,
    emotionalImpact: { type: Number, min: -1, max: 1 },
    timestamp: { type: Date, default: Date.now },
    significance: { type: Number, min: 0, max: 1 }
  }],
  
  // Performance Metrics
  performance: {
    totalInteractions: { type: Number, default: 0 },
    successfulTasks: { type: Number, default: 0 },
    failedTasks: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    collaborationScore: { type: Number, default: 0 },
    learningProgress: { type: Number, default: 0 }
  },
  
  // System Configuration
  settings: {
    interactionCooldown: { type: Number, default: 1000 },
    maxConcurrentTasks: { type: Number, default: 3 },
    priorityThreshold: { type: Number, default: 5 },
    energyLevel: { type: Number, default: 100, min: 0, max: 100 },
    maintenanceSchedule: {
      daily: { hour: Number, duration: Number },
      weekly: { day: Number, hour: Number, duration: Number }
    }
  },
  
  // Status & Health
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error', 'archived'],
    default: 'active'
  },
  health: {
    lastHealthCheck: Date,
    systemLoad: Number,
    responseTime: Number,
    errorRate: Number,
    memoryUsage: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
VirtualHumanSchema.index({ agentId: 1 });
VirtualHumanSchema.index({ userId: 1 });
VirtualHumanSchema.index({ currentState: 1 });
VirtualHumanSchema.index({ status: 1 });
VirtualHumanSchema.index({ 'activeTaskQueue.status': 1 });
VirtualHumanSchema.index({ 'relationships.targetId': 1 });

// Virtual fields
VirtualHumanSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.currentState !== 'offline';
});

VirtualHumanSchema.virtual('taskCompletionRate').get(function() {
  const total = this.performance.successfulTasks + this.performance.failedTasks;
  return total > 0 ? this.performance.successfulTasks / total : 0;
});

VirtualHumanSchema.virtual('autonomyScore').get(function() {
  return this.autonomyLevel * this.performance.collaborationScore;
});

// Instance methods
VirtualHumanSchema.methods.addTask = function(taskType, parameters, priority = 1) {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  this.activeTaskQueue.push({
    taskId,
    type: taskType,
    priority,
    parameters,
    createdAt: new Date()
  });
  
  this.activeTaskQueue.sort((a, b) => b.priority - a.priority);
  return this.save();
};

VirtualHumanSchema.methods.completeTask = function(taskId, result) {
  const task = this.activeTaskQueue.find(t => t.taskId === taskId);
  if (task) {
    task.status = 'completed';
    task.completedAt = new Date();
    task.result = result;
    this.performance.successfulTasks += 1;
  }
  return this.save();
};

VirtualHumanSchema.methods.updateRelationship = function(targetId, targetType) {
  let relationship = this.relationships.find(r => r.targetId === targetId);
  
  if (!relationship) {
    relationship = {
      targetId,
      targetType,
      relationshipType: 'acquaintance',
      strength: 0.1,
      interactionCount: 0,
      sharedInterests: []
    };
    this.relationships.push(relationship);
  }
  
  relationship.interactionCount += 1;
  relationship.lastInteraction = new Date();
  relationship.strength = Math.min(relationship.strength + 0.05, 1.0);
  
  return this.save();
};

VirtualHumanSchema.methods.addExperience = function(type, description, outcome, emotionalImpact = 0) {
  this.experiences.push({
    type,
    description,
    outcome,
    emotionalImpact,
    timestamp: new Date(),
    significance: Math.abs(emotionalImpact)
  });
  
  // Keep only top 100 experiences
  this.experiences = this.experiences
    .sort((a, b) => b.significance - a.significance)
    .slice(0, 100);
  
  return this.save();
};

// Static methods
VirtualHumanSchema.statics.findByAgentId = function(agentId) {
  return this.findOne({ agentId });
};

VirtualHumanSchema.statics.findActiveAgents = function() {
  return this.find({ status: 'active', currentState: { $ne: 'offline' } });
};

VirtualHumanSchema.statics.findByAutonomyLevel = function(minLevel) {
  return this.find({ autonomyLevel: { $gte: minLevel } });
};

module.exports = mongoose.model('VirtualHuman', VirtualHumanSchema);
