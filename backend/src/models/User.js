/**
 * User Model - VirtualSphere System
 * 특허 구현: 사용자 프로필 표준 (User Profile Standard - UPS)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Basic User Information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_-]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  
  // Patent Core: Personal LLM Instance
  llmInstanceId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `${process.env.LLM_INSTANCE_PREFIX || 'vs_llm_'}${this._id}`;
    }
  },
  
  // Patent Core: Virtual Human Agent
  virtualHumanId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `vh_${this._id}`;
    }
  },
  
  // User Profile Data (UPS Standard)
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: String,
    dateOfBirth: Date,
    location: {
      country: String,
      city: String,
      timezone: String
    },
    preferences: {
      language: { type: String, default: 'en' },
      theme: { type: String, default: 'light' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true }
      }
    }
  },
  
  // Patent Core: Interest Analysis
  interests: [{
    category: String,
    keywords: [String],
    weight: { type: Number, default: 1.0 },
    lastUpdated: { type: Date, default: Date.now }
  }],
  
  // Patent Core: Emotional Profile
  emotionalProfile: {
    baseState: {
      type: String,
      enum: ['calm', 'energetic', 'analytical', 'creative', 'social', 'reserved'],
      default: 'calm'
    },
    patterns: {
      morningMood: Number,
      eveningMood: Number,
      stressLevel: Number,
      socialPreference: Number,
      creativityLevel: Number
    },
    triggers: [{
      event: String,
      response: String,
      intensity: Number
    }],
    lastAnalysis: Date
  },
  
  // Patent Core: Collaboration History
  collaborationHistory: [{
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    role: String,
    contribution: Number,
    rating: Number,
    completedAt: Date
  }],
  
  // Patent Implementation: Virtual Assets
  assets: {
    virtualCurrency: { type: Number, default: 0 },
    nftTokens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NFTAsset' }],
    achievements: [{
      id: String,
      name: String,
      description: String,
      earnedAt: Date,
      rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'] }
    }],
    totalContribution: { type: Number, default: 0 }
  },
  
  // System Metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  onlineStatus: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: { type: Date, default: Date.now },
  joinedAt: { type: Date, default: Date.now },
  
  // Privacy & Security
  privacy: {
    profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
    dataSharing: { type: Boolean, default: false },
    analyticsOptIn: { type: Boolean, default: true }
  },
  
  // System Settings
  settings: {
    llmPersonality: {
      creativity: { type: Number, default: 0.7, min: 0, max: 1 },
      formality: { type: Number, default: 0.5, min: 0, max: 1 },
      verbosity: { type: Number, default: 0.6, min: 0, max: 1 },
      empathy: { type: Number, default: 0.8, min: 0, max: 1 }
    },
    virtualHumanAutonomy: { type: Number, default: 0.5, min: 0, max: 1 },
    emotionSensitivity: { type: Number, default: 0.7, min: 0, max: 1 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ llmInstanceId: 1 });
UserSchema.index({ virtualHumanId: 1 });
UserSchema.index({ 'interests.category': 1 });
UserSchema.index({ onlineStatus: 1 });
UserSchema.index({ lastSeen: -1 });

// Virtual fields
UserSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
});

UserSchema.virtual('isOnline').get(function() {
  return this.onlineStatus === 'online';
});

UserSchema.virtual('totalAssetValue').get(function() {
  return this.assets.virtualCurrency + (this.assets.nftTokens.length * 100); // Simplified calculation
});

// Pre-save middleware
UserSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, rounds);
  }
  
  // Update last seen
  if (this.isModified('onlineStatus') && this.onlineStatus === 'online') {
    this.lastSeen = new Date();
  }
  
  next();
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

UserSchema.methods.updateInterests = function(newInterests) {
  this.interests = newInterests.map(interest => ({
    ...interest,
    lastUpdated: new Date()
  }));
  return this.save();
};

UserSchema.methods.addAsset = function(assetType, assetData) {
  switch (assetType) {
    case 'currency':
      this.assets.virtualCurrency += assetData.amount;
      break;
    case 'nft':
      this.assets.nftTokens.push(assetData.tokenId);
      break;
    case 'achievement':
      this.assets.achievements.push({
        ...assetData,
        earnedAt: new Date()
      });
      break;
  }
  return this.save();
};

// Static methods
UserSchema.statics.findByLLMInstance = function(llmInstanceId) {
  return this.findOne({ llmInstanceId });
};

UserSchema.statics.findByVirtualHuman = function(virtualHumanId) {
  return this.findOne({ virtualHumanId });
};

UserSchema.statics.findSimilarInterests = function(interests, limit = 10) {
  return this.find({
    'interests.category': { $in: interests }
  }).limit(limit);
};

UserSchema.statics.getOnlineUsers = function() {
  return this.find({ onlineStatus: 'online' });
};

UserSchema.statics.getUsersByEmotionalProfile = function(baseState) {
  return this.find({ 'emotionalProfile.baseState': baseState });
};

module.exports = mongoose.model('User', UserSchema);
