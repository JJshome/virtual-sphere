const mongoose = require('mongoose');

const EmotionDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  virtualHumanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualHuman'
  },
  dataType: {
    type: String,
    enum: ['biometric', 'facial', 'voice', 'text', 'behavior', 'composite'],
    required: true
  },
  rawData: {
    // Biometric data
    eeg: {
      channels: [{ 
        name: String, 
        values: [Number],
        timestamp: Date
      }],
      dominantWave: {
        type: String,
        enum: ['delta', 'theta', 'alpha', 'beta', 'gamma']
      }
    },
    heartRate: {
      bpm: Number,
      variability: Number,
      timestamp: Date
    },
    eyeTracking: {
      pupilDilation: Number,
      gazePattern: [{
        x: Number,
        y: Number,
        timestamp: Date
      }],
      blinkRate: Number
    },
    // Facial expression data
    facial: {
      expressions: {
        happiness: { type: Number, min: 0, max: 1 },
        sadness: { type: Number, min: 0, max: 1 },
        anger: { type: Number, min: 0, max: 1 },
        surprise: { type: Number, min: 0, max: 1 },
        fear: { type: Number, min: 0, max: 1 },
        disgust: { type: Number, min: 0, max: 1 },
        contempt: { type: Number, min: 0, max: 1 },
        neutral: { type: Number, min: 0, max: 1 }
      },
      actionUnits: [{ 
        au: String, 
        intensity: Number 
      }],
      headPose: {
        pitch: Number,
        yaw: Number,
        roll: Number
      }
    },
    // Voice analysis
    voice: {
      pitch: {
        mean: Number,
        variance: Number
      },
      energy: Number,
      speakingRate: Number,
      pauseFrequency: Number,
      emotionalTone: {
        valence: { type: Number, min: -1, max: 1 },
        arousal: { type: Number, min: 0, max: 1 }
      }
    },
    // Text sentiment
    text: {
      content: String,
      sentiment: {
        polarity: { type: Number, min: -1, max: 1 },
        subjectivity: { type: Number, min: 0, max: 1 }
      },
      keywords: [String],
      emotionalWords: [{
        word: String,
        emotion: String,
        intensity: Number
      }]
    },
    // Behavioral patterns
    behavior: {
      interactionFrequency: Number,
      responseTime: Number, // milliseconds
      activityLevel: { type: Number, min: 0, max: 1 },
      socialEngagement: { type: Number, min: 0, max: 1 },
      focusDuration: Number // seconds
    }
  },
  processedEmotion: {
    primary: {
      emotion: {
        type: String,
        enum: ['happiness', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral', 'complex']
      },
      confidence: { type: Number, min: 0, max: 1 }
    },
    secondary: {
      emotion: String,
      confidence: { type: Number, min: 0, max: 1 }
    },
    valence: { type: Number, min: -1, max: 1 }, // Positive/Negative
    arousal: { type: Number, min: 0, max: 1 }, // Calm/Excited
    dominance: { type: Number, min: 0, max: 1 }, // Submissive/Dominant
    // Complex emotional states
    emotionalBlend: [{
      emotion: String,
      weight: { type: Number, min: 0, max: 1 }
    }],
    // Contextual modifiers
    context: {
      situation: String,
      socialContext: String,
      environmentalFactors: [String]
    }
  },
  analysis: {
    // AI-generated insights
    insights: [{
      type: {
        type: String,
        enum: ['pattern', 'anomaly', 'trend', 'recommendation']
      },
      description: String,
      confidence: { type: Number, min: 0, max: 1 },
      timestamp: Date
    }],
    // Emotion trajectory
    trajectory: {
      direction: {
        type: String,
        enum: ['improving', 'declining', 'stable', 'fluctuating']
      },
      velocity: Number, // Rate of change
      prediction: {
        nextLikely: String,
        probability: { type: Number, min: 0, max: 1 },
        timeframe: Number // minutes
      }
    },
    // Correlations with activities
    activityCorrelations: [{
      activity: String,
      correlation: { type: Number, min: -1, max: 1 },
      sampleSize: Number
    }]
  },
  metadata: {
    captureDevice: String,
    captureQuality: { type: Number, min: 0, max: 1 },
    environmentConditions: {
      lighting: String,
      noise: String,
      temperature: Number
    },
    sessionId: String,
    tags: [String]
  },
  privacy: {
    consentGiven: { type: Boolean, required: true },
    dataRetentionDays: { type: Number, default: 30 },
    anonymized: { type: Boolean, default: false },
    sharingPermissions: {
      research: { type: Boolean, default: false },
      improvement: { type: Boolean, default: true },
      thirdParty: { type: Boolean, default: false }
    }
  },
  timestamp: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }
});

// Methods
EmotionDataSchema.methods.anonymize = function() {
  this.userId = null;
  this.rawData.text = { content: '[REDACTED]' };
  this.metadata.sessionId = '[ANONYMIZED]';
  this.privacy.anonymized = true;
  return this.save();
};

EmotionDataSchema.methods.calculateEmotionalComplexity = function() {
  if (!this.processedEmotion.emotionalBlend) return 0;
  
  const blendCount = this.processedEmotion.emotionalBlend.length;
  const weights = this.processedEmotion.emotionalBlend.map(e => e.weight);
  const entropy = weights.reduce((sum, w) => {
    if (w > 0) {
      return sum - (w * Math.log2(w));
    }
    return sum;
  }, 0);
  
  return {
    blendCount,
    entropy,
    complexity: entropy / Math.log2(blendCount || 1)
  };
};

EmotionDataSchema.methods.generateInsights = async function() {
  const insights = [];
  
  // Check for emotional patterns
  if (this.processedEmotion.arousal > 0.8 && this.processedEmotion.valence < -0.5) {
    insights.push({
      type: 'pattern',
      description: 'High stress pattern detected - high arousal with negative valence',
      confidence: 0.85,
      timestamp: new Date()
    });
  }
  
  // Check for anomalies
  if (this.rawData.heartRate && this.rawData.heartRate.bpm > 120) {
    insights.push({
      type: 'anomaly',
      description: 'Elevated heart rate detected during emotional capture',
      confidence: 0.9,
      timestamp: new Date()
    });
  }
  
  // Generate recommendations
  if (this.processedEmotion.primary.emotion === 'sadness' && 
      this.processedEmotion.primary.confidence > 0.7) {
    insights.push({
      type: 'recommendation',
      description: 'Consider engaging in uplifting activities or social interactions',
      confidence: 0.7,
      timestamp: new Date()
    });
  }
  
  this.analysis.insights = insights;
  return this.save();
};

// Static methods
EmotionDataSchema.statics.aggregateEmotions = async function(userIds, timeRange) {
  const pipeline = [
    {
      $match: {
        userId: { $in: userIds },
        timestamp: {
          $gte: timeRange.start,
          $lte: timeRange.end
        }
      }
    },
    {
      $group: {
        _id: null,
        avgValence: { $avg: '$processedEmotion.valence' },
        avgArousal: { $avg: '$processedEmotion.arousal' },
        dominantEmotions: { $push: '$processedEmotion.primary.emotion' },
        count: { $sum: 1 }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Indexes
EmotionDataSchema.index({ userId: 1, timestamp: -1 });
EmotionDataSchema.index({ virtualHumanId: 1, timestamp: -1 });
EmotionDataSchema.index({ 'processedEmotion.primary.emotion': 1 });
EmotionDataSchema.index({ dataType: 1, timestamp: -1 });
EmotionDataSchema.index({ 'metadata.sessionId': 1 });

// TTL index for automatic data expiration
EmotionDataSchema.index({ timestamp: 1 }, { 
  expireAfterSeconds: 30 * 24 * 60 * 60 // 30 days default
});

// Pre-save hook to set expiration date
EmotionDataSchema.pre('save', function(next) {
  if (!this.expiresAt && this.privacy.dataRetentionDays) {
    this.expiresAt = new Date(Date.now() + this.privacy.dataRetentionDays * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('EmotionData', EmotionDataSchema);
