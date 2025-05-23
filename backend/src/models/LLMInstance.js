/**
 * LLM Instance Model - VirtualSphere System
 * 특허 구현: 개인별 LLM 인스턴스 프로토콜 (LLM Instance Protocol - LIP)
 */

const mongoose = require('mongoose');

const LLMInstanceSchema = new mongoose.Schema({
  // Core Identification
  instanceId: {
    type: String,
    required: true,
    unique: true,
    match: /^vs_llm_[a-zA-Z0-9]+$/
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // LLM Configuration
  modelType: {
    type: String,
    enum: ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'custom'],
    default: 'gpt-4'
  },
  apiProvider: {
    type: String,
    enum: ['openai', 'anthropic', 'custom'],
    default: 'openai'
  },
  
  // Patent Core: Personality Traits Customization
  personalityTraits: {
    creativity: { type: Number, default: 0.7, min: 0, max: 1 },
    formality: { type: Number, default: 0.5, min: 0, max: 1 },
    verbosity: { type: Number, default: 0.6, min: 0, max: 1 },
    empathy: { type: Number, default: 0.8, min: 0, max: 1 },
    analyticalThinking: { type: Number, default: 0.7, min: 0, max: 1 },
    humor: { type: Number, default: 0.4, min: 0, max: 1 },
    curiosity: { type: Number, default: 0.8, min: 0, max: 1 },
    supportiveness: { type: Number, default: 0.9, min: 0, max: 1 }
  },
  
  // Patent Core: Personal Knowledge Base
  knowledgeBase: {
    domains: [{
      field: String,
      expertise: { type: Number, min: 0, max: 1 },
      keywords: [String],
      lastUpdated: { type: Date, default: Date.now }
    }],
    personalFacts: [{
      category: String,
      fact: String,
      importance: { type: Number, min: 0, max: 1 },
      createdAt: { type: Date, default: Date.now }
    }],
    preferences: [{
      type: String,
      value: String,
      confidence: { type: Number, min: 0, max: 1 }
    }],
    memorySize: { type: Number, default: 1000 }
  },
  
  // Patent Core: Conversation History & Learning
  conversationHistory: [{
    sessionId: String,
    timestamp: { type: Date, default: Date.now },
    messages: [{
      role: { type: String, enum: ['user', 'assistant', 'system'] },
      content: String,
      tokens: Number,
      metadata: {
        emotion: String,
        intent: String,
        topics: [String]
      }
    }],
    summary: String,
    learningPoints: [String]
  }],
  
  // Patent Core: Learning Parameters
  learningParameters: {
    adaptationRate: { type: Number, default: 0.1, min: 0, max: 1 },
    memoryRetention: { type: Number, default: 0.8, min: 0, max: 1 },
    personalityStability: { type: Number, default: 0.7, min: 0, max: 1 },
    contextWindowSize: { type: Number, default: 10 },
    learningThreshold: { type: Number, default: 0.6, min: 0, max: 1 }
  },
  
  // Performance Metrics
  usage: {
    totalQueries: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    satisfactionScore: { type: Number, default: 0 },
    lastUsed: Date
  },
  
  // Configuration Settings
  settings: {
    maxTokens: { type: Number, default: 2048 },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    topP: { type: Number, default: 1, min: 0, max: 1 },
    frequencyPenalty: { type: Number, default: 0, min: -2, max: 2 },
    presencePenalty: { type: Number, default: 0, min: -2, max: 2 },
    systemPrompt: String,
    customInstructions: String
  },
  
  // Status & Health
  status: {
    type: String,
    enum: ['active', 'inactive', 'training', 'error', 'maintenance'],
    default: 'active'
  },
  health: {
    lastHealthCheck: Date,
    errorCount: { type: Number, default: 0 },
    uptime: { type: Number, default: 0 },
    memoryUsage: Number,
    responseQuality: Number
  },
  
  // Evolution Tracking
  evolution: {
    version: { type: String, default: '1.0.0' },
    majorUpdates: [{
      version: String,
      changes: [String],
      timestamp: { type: Date, default: Date.now },
      reason: String
    }],
    personalityEvolution: [{
      trait: String,
      oldValue: Number,
      newValue: Number,
      reason: String,
      timestamp: { type: Date, default: Date.now }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
LLMInstanceSchema.index({ instanceId: 1 });
LLMInstanceSchema.index({ userId: 1 });
LLMInstanceSchema.index({ status: 1 });
LLMInstanceSchema.index({ 'usage.lastUsed': -1 });
LLMInstanceSchema.index({ 'knowledgeBase.domains.field': 1 });

// Virtual fields
LLMInstanceSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

LLMInstanceSchema.virtual('averagePersonalityScore').get(function() {
  const traits = this.personalityTraits;
  const values = Object.values(traits);
  return values.reduce((sum, val) => sum + val, 0) / values.length;
});

LLMInstanceSchema.virtual('memoryUtilization').get(function() {
  const totalMemory = this.knowledgeBase.memorySize;
  const usedMemory = this.conversationHistory.length + 
                     this.knowledgeBase.personnalFacts.length;
  return totalMemory > 0 ? usedMemory / totalMemory : 0;
});

// Instance methods
LLMInstanceSchema.methods.addConversation = function(sessionId, messages, summary) {
  this.conversationHistory.push({
    sessionId,
    messages,
    summary,
    timestamp: new Date()
  });
  
  // Maintain memory limit
  if (this.conversationHistory.length > this.knowledgeBase.memorySize) {
    this.conversationHistory.shift();
  }
  
  return this.save();
};

LLMInstanceSchema.methods.updatePersonality = function(trait, newValue, reason) {
  const oldValue = this.personalityTraits[trait];
  this.personalityTraits[trait] = newValue;
  
  this.evolution.personalityEvolution.push({
    trait,
    oldValue,
    newValue,
    reason,
    timestamp: new Date()
  });
  
  return this.save();
};

LLMInstanceSchema.methods.addKnowledge = function(domain, expertise, keywords) {
  const existingDomain = this.knowledgeBase.domains.find(d => d.field === domain);
  
  if (existingDomain) {
    existingDomain.expertise = Math.max(existingDomain.expertise, expertise);
    existingDomain.keywords = [...new Set([...existingDomain.keywords, ...keywords])];
    existingDomain.lastUpdated = new Date();
  } else {
    this.knowledgeBase.domains.push({
      field: domain,
      expertise,
      keywords,
      lastUpdated: new Date()
    });
  }
  
  return this.save();
};

LLMInstanceSchema.methods.recordUsage = function(tokens, responseTime, satisfaction) {
  this.usage.totalQueries += 1;
  this.usage.totalTokens += tokens;
  this.usage.lastUsed = new Date();
  
  // Update averages
  const totalQueries = this.usage.totalQueries;
  this.usage.averageResponseTime = 
    ((this.usage.averageResponseTime * (totalQueries - 1)) + responseTime) / totalQueries;
  
  if (satisfaction !== undefined) {
    this.usage.satisfactionScore = 
      ((this.usage.satisfactionScore * (totalQueries - 1)) + satisfaction) / totalQueries;
  }
  
  return this.save();
};

LLMInstanceSchema.methods.generateSystemPrompt = function() {
  const { personalityTraits, knowledgeBase } = this;
  
  let prompt = `You are a personalized AI assistant with the following characteristics:
  
Personality:
- Creativity: ${personalityTraits.creativity}/1.0
- Formality: ${personalityTraits.formality}/1.0
- Verbosity: ${personalityTraits.verbosity}/1.0
- Empathy: ${personalityTraits.empathy}/1.0
- Analytical Thinking: ${personalityTraits.analyticalThinking}/1.0
- Humor: ${personalityTraits.humor}/1.0

Knowledge Areas:`;
  
  knowledgeBase.domains.forEach(domain => {
    prompt += `\n- ${domain.field} (expertise: ${domain.expertise}/1.0)`;
  });
  
  if (this.settings.customInstructions) {
    prompt += `\n\nCustom Instructions:\n${this.settings.customInstructions}`;
  }
  
  return prompt;
};

// Static methods
LLMInstanceSchema.statics.findByInstanceId = function(instanceId) {
  return this.findOne({ instanceId });
};

LLMInstanceSchema.statics.findActiveInstances = function() {
  return this.find({ status: 'active' });
};

LLMInstanceSchema.statics.getInstancesByPersonalityTrait = function(trait, minValue) {
  const query = {};
  query[`personalityTraits.${trait}`] = { $gte: minValue };
  return this.find(query);
};

LLMInstanceSchema.statics.getInstancesByDomain = function(domain, minExpertise = 0.5) {
  return this.find({
    'knowledgeBase.domains': {
      $elemMatch: {
        field: domain,
        expertise: { $gte: minExpertise }
      }
    }
  });
};

module.exports = mongoose.model('LLMInstance', LLMInstanceSchema);
