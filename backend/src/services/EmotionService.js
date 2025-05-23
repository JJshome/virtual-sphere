const EmotionData = require('../models/EmotionData');
const VirtualHuman = require('../models/VirtualHuman');
const DynamicWorld = require('../models/DynamicWorld');
const tf = require('@tensorflow/tfjs-node');
const logger = require('../utils/logger');

class EmotionService {
  constructor() {
    this.emotionModel = null;
    this.emotionThresholds = {
      happiness: { low: 0.3, high: 0.7 },
      sadness: { low: 0.3, high: 0.7 },
      anger: { low: 0.3, high: 0.6 },
      fear: { low: 0.3, high: 0.6 },
      surprise: { low: 0.4, high: 0.7 },
      disgust: { low: 0.3, high: 0.6 }
    };
    this.initializeEmotionModels();
  }

  /**
   * Initialize emotion recognition models
   */
  async initializeEmotionModels() {
    try {
      // In a real implementation, load pre-trained models
      // For now, we'll use simulation
      logger.info('Emotion recognition models initialized');
    } catch (error) {
      logger.error('Error initializing emotion models:', error);
    }
  }

  /**
   * Process multi-modal emotion data
   */
  async processEmotionData(userId, emotionInput) {
    try {
      const emotionData = new EmotionData({
        userId,
        dataType: emotionInput.dataType || 'composite',
        rawData: this.preprocessRawData(emotionInput.rawData),
        privacy: {
          consentGiven: true,
          dataRetentionDays: emotionInput.retentionDays || 30,
          sharingPermissions: emotionInput.sharingPermissions || {
            research: false,
            improvement: true,
            thirdParty: false
          }
        }
      });

      // Process emotion based on data type
      const processedEmotion = await this.analyzeEmotion(emotionData.rawData, emotionData.dataType);
      emotionData.processedEmotion = processedEmotion;

      // Generate insights
      await emotionData.generateInsights();

      // Save emotion data
      await emotionData.save();

      // Update virtual human if exists
      const virtualHuman = await VirtualHuman.findOne({ userId });
      if (virtualHuman) {
        await this.updateVirtualHumanEmotion(virtualHuman, processedEmotion);
      }

      logger.info(`Processed emotion data for user ${userId}`);
      return emotionData;
    } catch (error) {
      logger.error('Error processing emotion data:', error);
      throw error;
    }
  }

  /**
   * Preprocess raw emotion data
   */
  preprocessRawData(rawData) {
    const processed = { ...rawData };

    // Normalize biometric data if present
    if (processed.eeg) {
      // Normalize EEG channels
      if (processed.eeg.channels) {
        processed.eeg.channels = processed.eeg.channels.map(channel => ({
          ...channel,
          values: this.normalizeTimeSeries(channel.values)
        }));
      }
    }

    // Normalize facial expressions
    if (processed.facial && processed.facial.expressions) {
      const expressions = processed.facial.expressions;
      const total = Object.values(expressions).reduce((sum, val) => sum + val, 0);
      if (total > 0) {
        Object.keys(expressions).forEach(key => {
          expressions[key] = expressions[key] / total;
        });
      }
    }

    return processed;
  }

  /**
   * Normalize time series data
   */
  normalizeTimeSeries(values) {
    if (!values || values.length === 0) return values;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return values;
    
    return values.map(val => (val - mean) / stdDev);
  }

  /**
   * Analyze emotion from multi-modal data
   */
  async analyzeEmotion(rawData, dataType) {
    let emotions = {};
    let confidence = 0;

    switch (dataType) {
      case 'facial':
        emotions = this.analyzeFacialEmotion(rawData.facial);
        confidence = 0.8;
        break;
      
      case 'voice':
        emotions = this.analyzeVoiceEmotion(rawData.voice);
        confidence = 0.7;
        break;
      
      case 'text':
        emotions = this.analyzeTextEmotion(rawData.text);
        confidence = 0.6;
        break;
      
      case 'biometric':
        emotions = this.analyzeBiometricEmotion(rawData);
        confidence = 0.9;
        break;
      
      case 'composite':
        emotions = await this.analyzeCompositeEmotion(rawData);
        confidence = 0.85;
        break;
      
      default:
        emotions = this.generateDefaultEmotions();
        confidence = 0.5;
    }

    // Calculate valence, arousal, dominance
    const vad = this.calculateVAD(emotions);

    // Determine primary and secondary emotions
    const sortedEmotions = Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, value]) => value > 0.1);

    const processedEmotion = {
      primary: {
        emotion: sortedEmotions[0]?.[0] || 'neutral',
        confidence: sortedEmotions[0]?.[1] * confidence || 0
      },
      secondary: sortedEmotions[1] ? {
        emotion: sortedEmotions[1][0],
        confidence: sortedEmotions[1][1] * confidence
      } : null,
      valence: vad.valence,
      arousal: vad.arousal,
      dominance: vad.dominance,
      emotionalBlend: sortedEmotions.map(([emotion, weight]) => ({
        emotion,
        weight: weight * confidence
      }))
    };

    return processedEmotion;
  }

  /**
   * Analyze facial emotions
   */
  analyzeFacialEmotion(facialData) {
    if (!facialData || !facialData.expressions) {
      return this.generateDefaultEmotions();
    }

    // Use facial expression data directly with some processing
    const expressions = { ...facialData.expressions };
    
    // Apply thresholds
    Object.keys(expressions).forEach(emotion => {
      if (expressions[emotion] < 0.1) {
        expressions[emotion] = 0;
      }
    });

    return expressions;
  }

  /**
   * Analyze voice emotions
   */
  analyzeVoiceEmotion(voiceData) {
    if (!voiceData) {
      return this.generateDefaultEmotions();
    }

    const emotions = {};
    
    // Map voice features to emotions
    const { pitch, energy, emotionalTone } = voiceData;
    
    if (emotionalTone) {
      // High valence + high arousal = happiness
      if (emotionalTone.valence > 0.5 && emotionalTone.arousal > 0.5) {
        emotions.happiness = emotionalTone.valence * emotionalTone.arousal;
      }
      // Low valence + low arousal = sadness
      if (emotionalTone.valence < -0.3 && emotionalTone.arousal < 0.5) {
        emotions.sadness = Math.abs(emotionalTone.valence) * (1 - emotionalTone.arousal);
      }
      // Low valence + high arousal = anger
      if (emotionalTone.valence < -0.3 && emotionalTone.arousal > 0.6) {
        emotions.anger = Math.abs(emotionalTone.valence) * emotionalTone.arousal;
      }
    }

    // High pitch variance might indicate surprise
    if (pitch && pitch.variance > 50) {
      emotions.surprise = Math.min(1, pitch.variance / 100);
    }

    // Fill remaining emotions
    emotions.fear = emotions.fear || 0;
    emotions.disgust = emotions.disgust || 0;
    emotions.neutral = 1 - Object.values(emotions).reduce((sum, val) => sum + val, 0);

    return emotions;
  }

  /**
   * Analyze text emotions
   */
  analyzeTextEmotion(textData) {
    if (!textData || !textData.sentiment) {
      return this.generateDefaultEmotions();
    }

    const emotions = {};
    const { sentiment, emotionalWords } = textData;

    // Map sentiment to basic emotions
    if (sentiment.polarity > 0.3) {
      emotions.happiness = sentiment.polarity;
    } else if (sentiment.polarity < -0.3) {
      emotions.sadness = Math.abs(sentiment.polarity) * 0.5;
      emotions.anger = Math.abs(sentiment.polarity) * 0.3;
    }

    // Process emotional words
    if (emotionalWords && emotionalWords.length > 0) {
      emotionalWords.forEach(word => {
        if (emotions[word.emotion] !== undefined) {
          emotions[word.emotion] = Math.min(1, emotions[word.emotion] + word.intensity * 0.2);
        }
      });
    }

    // Fill remaining emotions
    const definedEmotions = ['happiness', 'sadness', 'anger', 'fear', 'surprise', 'disgust'];
    definedEmotions.forEach(emotion => {
      if (!emotions[emotion]) emotions[emotion] = 0;
    });
    
    emotions.neutral = Math.max(0, 1 - Object.values(emotions).reduce((sum, val) => sum + val, 0));

    return emotions;
  }

  /**
   * Analyze biometric emotions
   */
  analyzeBiometricEmotion(biometricData) {
    const emotions = {};

    // EEG-based emotion detection (simplified)
    if (biometricData.eeg && biometricData.eeg.dominantWave) {
      switch (biometricData.eeg.dominantWave) {
        case 'gamma':
          emotions.happiness = 0.7;
          emotions.surprise = 0.3;
          break;
        case 'beta':
          emotions.neutral = 0.6;
          emotions.happiness = 0.2;
          break;
        case 'alpha':
          emotions.neutral = 0.8;
          break;
        case 'theta':
          emotions.sadness = 0.4;
          emotions.neutral = 0.4;
          break;
        case 'delta':
          emotions.sadness = 0.3;
          emotions.neutral = 0.5;
          break;
      }
    }

    // Heart rate based adjustments
    if (biometricData.heartRate) {
      const hr = biometricData.heartRate.bpm;
      if (hr > 100) {
        emotions.fear = Math.min(0.5, (hr - 100) / 50);
        emotions.anger = Math.min(0.3, (hr - 100) / 100);
      }
    }

    // Eye tracking adjustments
    if (biometricData.eyeTracking) {
      if (biometricData.eyeTracking.pupilDilation > 0.7) {
        emotions.surprise = Math.max(emotions.surprise || 0, 0.4);
      }
    }

    // Normalize emotions
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      Object.keys(emotions).forEach(key => {
        emotions[key] = emotions[key] / total;
      });
    }

    return emotions;
  }

  /**
   * Analyze composite emotions from multiple modalities
   */
  async analyzeCompositeEmotion(rawData) {
    const emotionResults = [];
    const weights = {
      facial: 0.35,
      voice: 0.25,
      text: 0.15,
      biometric: 0.25
    };

    if (rawData.facial) {
      emotionResults.push({
        emotions: this.analyzeFacialEmotion(rawData.facial),
        weight: weights.facial
      });
    }

    if (rawData.voice) {
      emotionResults.push({
        emotions: this.analyzeVoiceEmotion(rawData.voice),
        weight: weights.voice
      });
    }

    if (rawData.text) {
      emotionResults.push({
        emotions: this.analyzeTextEmotion(rawData.text),
        weight: weights.text
      });
    }

    if (rawData.eeg || rawData.heartRate) {
      emotionResults.push({
        emotions: this.analyzeBiometricEmotion(rawData),
        weight: weights.biometric
      });
    }

    // Weighted average of all modalities
    const compositeEmotions = {};
    const emotionTypes = ['happiness', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];
    
    emotionTypes.forEach(emotion => {
      compositeEmotions[emotion] = emotionResults.reduce((sum, result) => {
        return sum + (result.emotions[emotion] || 0) * result.weight;
      }, 0);
    });

    // Normalize
    const total = Object.values(compositeEmotions).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      Object.keys(compositeEmotions).forEach(key => {
        compositeEmotions[key] = compositeEmotions[key] / total;
      });
    }

    return compositeEmotions;
  }

  /**
   * Calculate Valence-Arousal-Dominance values
   */
  calculateVAD(emotions) {
    // Valence: positive vs negative
    const positiveEmotions = (emotions.happiness || 0) + (emotions.surprise || 0) * 0.5;
    const negativeEmotions = (emotions.sadness || 0) + (emotions.anger || 0) + 
                           (emotions.fear || 0) + (emotions.disgust || 0);
    const valence = positiveEmotions - negativeEmotions;

    // Arousal: high vs low energy
    const highArousal = (emotions.anger || 0) + (emotions.fear || 0) + 
                       (emotions.surprise || 0) + (emotions.happiness || 0) * 0.7;
    const lowArousal = (emotions.sadness || 0) + (emotions.neutral || 0);
    const arousal = Math.max(0, Math.min(1, highArousal));

    // Dominance: control vs submission
    const dominance = (emotions.anger || 0) * 0.8 + (emotions.happiness || 0) * 0.6 - 
                     (emotions.fear || 0) * 0.8 - (emotions.sadness || 0) * 0.4;

    return {
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: arousal,
      dominance: Math.max(0, Math.min(1, (dominance + 1) / 2))
    };
  }

  /**
   * Generate default emotions
   */
  generateDefaultEmotions() {
    return {
      happiness: 0.2,
      sadness: 0.1,
      anger: 0.1,
      fear: 0.1,
      surprise: 0.1,
      disgust: 0.05,
      neutral: 0.35
    };
  }

  /**
   * Update virtual human emotion based on processed emotion
   */
  async updateVirtualHumanEmotion(virtualHuman, processedEmotion) {
    try {
      // Map processed emotions to virtual human emotional state
      const newEmotionalState = {
        happiness: processedEmotion.emotionalBlend.find(e => e.emotion === 'happiness')?.weight || 0.5,
        stress: processedEmotion.arousal * (1 - processedEmotion.valence) / 2,
        energy: processedEmotion.arousal,
        focus: 1 - (processedEmotion.emotionalBlend.length - 1) * 0.1 // More emotions = less focus
      };

      await virtualHuman.updateEmotionalState(newEmotionalState, 'emotion_analysis');
      logger.info(`Updated virtual human emotion for ${virtualHuman.name}`);
    } catch (error) {
      logger.error('Error updating virtual human emotion:', error);
    }
  }

  /**
   * Get emotion history for a user
   */
  async getEmotionHistory(userId, timeRange) {
    const query = { userId };
    
    if (timeRange) {
      query.timestamp = {
        $gte: timeRange.start,
        $lte: timeRange.end
      };
    }

    return EmotionData.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .select('processedEmotion timestamp dataType');
  }

  /**
   * Get emotion analytics for a user
   */
  async getEmotionAnalytics(userId, period = '7d') {
    const periodMs = this.parsePeriod(period);
    const startDate = new Date(Date.now() - periodMs);

    const emotions = await EmotionData.find({
      userId,
      timestamp: { $gte: startDate }
    });

    if (emotions.length === 0) {
      return null;
    }

    // Calculate averages
    const emotionSums = {};
    const emotionCounts = {};

    emotions.forEach(data => {
      if (data.processedEmotion && data.processedEmotion.emotionalBlend) {
        data.processedEmotion.emotionalBlend.forEach(blend => {
          emotionSums[blend.emotion] = (emotionSums[blend.emotion] || 0) + blend.weight;
          emotionCounts[blend.emotion] = (emotionCounts[blend.emotion] || 0) + 1;
        });
      }
    });

    const averageEmotions = {};
    Object.keys(emotionSums).forEach(emotion => {
      averageEmotions[emotion] = emotionSums[emotion] / emotionCounts[emotion];
    });

    // Calculate trends
    const recentEmotions = emotions.slice(0, Math.floor(emotions.length / 3));
    const olderEmotions = emotions.slice(Math.floor(emotions.length * 2 / 3));

    const trends = this.calculateEmotionTrends(recentEmotions, olderEmotions);

    return {
      period,
      totalRecords: emotions.length,
      averageEmotions,
      trends,
      dominantEmotion: Object.entries(averageEmotions)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral',
      emotionalStability: this.calculateEmotionalStability(emotions)
    };
  }

  /**
   * Parse period string to milliseconds
   */
  parsePeriod(period) {
    const unit = period.slice(-1);
    const value = parseInt(period.slice(0, -1));
    
    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      case 'm': return value * 30 * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    }
  }

  /**
   * Calculate emotion trends
   */
  calculateEmotionTrends(recentEmotions, olderEmotions) {
    const trends = {};
    
    // Calculate average emotions for each period
    const recentAvg = this.calculatePeriodAverages(recentEmotions);
    const olderAvg = this.calculatePeriodAverages(olderEmotions);
    
    Object.keys(recentAvg).forEach(emotion => {
      const recent = recentAvg[emotion] || 0;
      const older = olderAvg[emotion] || 0;
      
      if (older === 0) {
        trends[emotion] = recent > 0 ? 'increasing' : 'stable';
      } else {
        const change = (recent - older) / older;
        if (change > 0.1) trends[emotion] = 'increasing';
        else if (change < -0.1) trends[emotion] = 'decreasing';
        else trends[emotion] = 'stable';
      }
    });
    
    return trends;
  }

  /**
   * Calculate period averages
   */
  calculatePeriodAverages(emotions) {
    const sums = {};
    const counts = {};
    
    emotions.forEach(data => {
      if (data.processedEmotion && data.processedEmotion.emotionalBlend) {
        data.processedEmotion.emotionalBlend.forEach(blend => {
          sums[blend.emotion] = (sums[blend.emotion] || 0) + blend.weight;
          counts[blend.emotion] = (counts[blend.emotion] || 0) + 1;
        });
      }
    });
    
    const averages = {};
    Object.keys(sums).forEach(emotion => {
      averages[emotion] = sums[emotion] / counts[emotion];
    });
    
    return averages;
  }

  /**
   * Calculate emotional stability
   */
  calculateEmotionalStability(emotions) {
    if (emotions.length < 2) return 1;
    
    let totalVariance = 0;
    let comparisons = 0;
    
    for (let i = 1; i < emotions.length; i++) {
      const prev = emotions[i - 1].processedEmotion;
      const curr = emotions[i].processedEmotion;
      
      if (prev && curr) {
        const variance = Math.abs(prev.valence - curr.valence) + 
                        Math.abs(prev.arousal - curr.arousal);
        totalVariance += variance;
        comparisons++;
      }
    }
    
    if (comparisons === 0) return 1;
    
    const averageVariance = totalVariance / comparisons;
    return Math.max(0, 1 - averageVariance);
  }
}

module.exports = new EmotionService();
