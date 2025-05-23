const mongoose = require('mongoose');

const emotionDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  dataType: {
    type: String,
    enum: ['facial', 'voice', 'text', 'physiological', 'composite'],
    required: true
  },
  
  emotions: {
    happy: { type: Number, min: 0, max: 1, default: 0 },
    sad: { type: Number, min: 0, max: 1, default: 0 },
    angry: { type: Number, min: 0, max: 1, default: 0 },
    fear: { type: Number, min: 0, max: 1, default: 0 },
    surprise: { type: Number, min: 0, max: 1, default: 0 },
    disgust: { type: Number, min: 0, max: 1, default: 0 },
    neutral: { type: Number, min: 0, max: 1, default: 0 }
  },
  
  primaryEmotion: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'],
    required: true
  },
  
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  
  emotionalComplexity: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  
  context: {
    activity: {
      type: String,
      enum: ['work', 'social', 'personal', 'entertainment', 'other'],
      default: 'other'
    },
    location: {
      type: String,
      default: 'unknown'
    },
    environmentalFactors: [{
      type: String
    }],
    socialContext: {
      alone: { type: Boolean, default: true },
      peopleCount: { type: Number, default: 0 },
      relationships: [String]
    }
  },
  
  privacy: {
    shareLevel: {
      type: String,
      enum: ['private', 'friends', 'public'],
      default: 'private'
    },
    anonymized: {
      type: Boolean,
      default: false
    },
    dataRetentionDays: {
      type: Number,
      default: 90
    }
  },
  
  metadata: {
    processingModel: {
      type: String,
      default: 'gpt-4'
    },
    processingTime: {
      type: Number // milliseconds
    },
    sourceDevice: {
      type: String
    },
    sessionId: {
      type: String
    },
    tags: [String]
  },
  
  insights: [{
    type: {
      type: String,
      enum: ['trend', 'warning', 'info', 'success', 'analysis', 'suggestion', 'alert']
    },
    message: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    recommendation: String,
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
emotionDataSchema.index({ userId: 1, timestamp: -1 });
emotionDataSchema.index({ userId: 1, primaryEmotion: 1 });
emotionDataSchema.index({ userId: 1, dataType: 1 });
emotionDataSchema.index({ 'privacy.anonymized': 1 });
emotionDataSchema.index({ 'context.activity': 1 });

// Virtual for emotion intensity
emotionDataSchema.virtual('emotionIntensity').get(function() {
  const emotions = this.emotions;
  const max = Math.max(...Object.values(emotions));
  return max;
});

// Method to anonymize data
emotionDataSchema.methods.anonymize = function() {
  this.privacy.anonymized = true;
  this.context.location = 'anonymized';
  this.context.socialContext = {
    alone: true,
    peopleCount: 0,
    relationships: []
  };
  this.metadata.sourceDevice = 'anonymized';
  this.metadata.sessionId = 'anonymized';
  return this.save();
};

// Method to check if data should be deleted
emotionDataSchema.methods.shouldBeDeleted = function() {
  const retentionDays = this.privacy.dataRetentionDays;
  const createdDate = new Date(this.createdAt);
  const expiryDate = new Date(createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  return new Date() > expiryDate;
};

// Static method to clean up old data
emotionDataSchema.statics.cleanupOldData = async function() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // Default 90 days
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate },
    'privacy.anonymized': false
  });
  
  return result.deletedCount;
};

// Static method to get emotion statistics
emotionDataSchema.statics.getEmotionStats = async function(userId, startDate, endDate) {
  const match = {
    userId: mongoose.Types.ObjectId(userId),
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$primaryEmotion',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        avgComplexity: { $avg: '$emotionalComplexity' }
      }
    },
    {
      $project: {
        emotion: '$_id',
        count: 1,
        avgConfidence: { $round: ['$avgConfidence', 2] },
        avgComplexity: { $round: ['$avgComplexity', 2] },
        _id: 0
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return stats;
};

// Pre-save hook to ensure emotion scores sum to 1
emotionDataSchema.pre('save', function(next) {
  const emotions = this.emotions;
  const sum = Object.values(emotions).reduce((a, b) => a + b, 0);
  
  if (sum > 0 && Math.abs(sum - 1) > 0.01) {
    // Normalize emotions to sum to 1
    Object.keys(emotions).forEach(key => {
      emotions[key] = emotions[key] / sum;
    });
  }
  
  next();
});

// Method to export data for user
emotionDataSchema.methods.exportData = function() {
  const exported = this.toObject();
  
  // Remove sensitive information if anonymized
  if (this.privacy.anonymized) {
    delete exported.metadata.sourceDevice;
    delete exported.metadata.sessionId;
    exported.context.location = 'anonymized';
  }
  
  // Remove internal fields
  delete exported.__v;
  delete exported._id;
  
  return exported;
};

module.exports = mongoose.model('EmotionData', emotionDataSchema);
