const OpenAI = require('openai');
const EmotionData = require('../models/EmotionData');
const User = require('../models/User');
const logger = require('../utils/logger');

class EmotionService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Process emotion data from various sources
  async processEmotionData(userId, emotionData) {
    try {
      const { dataType, rawData, context } = emotionData;
      
      // Process based on data type
      let processedEmotion;
      switch (dataType) {
        case 'facial':
          processedEmotion = await this.processFacialEmotion(rawData.facial);
          break;
        case 'voice':
          processedEmotion = await this.processVoiceEmotion(rawData.voice);
          break;
        case 'text':
          processedEmotion = await this.processTextEmotion(rawData.text);
          break;
        case 'physiological':
          processedEmotion = await this.processPhysiologicalData(rawData.physiological);
          break;
        case 'composite':
          processedEmotion = await this.processCompositeEmotion(rawData);
          break;
        default:
          throw new Error('Unsupported data type');
      }

      // Calculate emotional complexity
      const emotionalComplexity = this.calculateEmotionalComplexity(processedEmotion.emotions);

      // Create emotion data record
      const emotionRecord = new EmotionData({
        userId,
        dataType,
        emotions: processedEmotion.emotions,
        primaryEmotion: processedEmotion.primaryEmotion,
        confidence: processedEmotion.confidence,
        emotionalComplexity,
        context,
        metadata: {
          processingModel: 'gpt-4',
          processingTime: Date.now()
        }
      });

      await emotionRecord.save();

      // Update user's emotion profile
      await this.updateUserEmotionProfile(userId, emotionRecord);

      // Generate insights if needed
      const insights = await this.generateEmotionInsights(userId, emotionRecord);

      return {
        success: true,
        data: emotionRecord,
        insights
      };
    } catch (error) {
      logger.error('Error processing emotion data:', error);
      throw error;
    }
  }

  // Process facial emotion using GPT-4 Vision
  async processFacialEmotion(imageData) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze the facial expression in this image and provide emotion scores for: happy, sad, angry, fear, surprise, disgust, neutral. Return JSON format with emotion scores (0-1) and primary emotion."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        emotions: result.emotions,
        primaryEmotion: result.primaryEmotion,
        confidence: result.confidence || 0.8
      };
    } catch (error) {
      logger.error('Error processing facial emotion:', error);
      // Fallback to mock data for testing
      return this.getMockEmotionData();
    }
  }

  // Process voice emotion
  async processVoiceEmotion(audioData) {
    try {
      // In production, this would use a voice emotion recognition API
      // For now, we'll use GPT-4 to analyze transcribed text
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an emotion analysis expert. Analyze the emotional tone and return emotion scores."
          },
          {
            role: "user",
            content: `Analyze the emotional tone and provide scores for: happy, sad, angry, fear, surprise, disgust, neutral. Return JSON format with emotion scores (0-1) and primary emotion. Audio transcript: "${audioData}"`
          }
        ],
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        emotions: result.emotions,
        primaryEmotion: result.primaryEmotion,
        confidence: result.confidence || 0.75
      };
    } catch (error) {
      logger.error('Error processing voice emotion:', error);
      return this.getMockEmotionData();
    }
  }

  // Process text emotion
  async processTextEmotion(textData) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an emotion analysis expert. Analyze the text and return detailed emotion scores."
          },
          {
            role: "user",
            content: `Analyze the emotions in this text: "${textData.content}". Provide scores (0-1) for: happy, sad, angry, fear, surprise, disgust, neutral. Also identify the primary emotion and confidence level. Return in JSON format.`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        emotions: result.emotions,
        primaryEmotion: result.primaryEmotion,
        confidence: result.confidence || 0.85
      };
    } catch (error) {
      logger.error('Error processing text emotion:', error);
      return this.getMockEmotionData();
    }
  }

  // Process physiological data
  async processPhysiologicalData(physioData) {
    // Process heart rate, skin conductance, etc.
    const { heartRate, skinConductance, temperature } = physioData;
    
    // Simple rule-based emotion detection from physiological data
    const emotions = {
      happy: 0,
      sad: 0,
      angry: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 0.5
    };

    // High heart rate + high skin conductance = excitement/fear
    if (heartRate > 100 && skinConductance > 0.7) {
      emotions.fear = 0.7;
      emotions.surprise = 0.5;
    }
    // Low heart rate + normal skin conductance = calm/happy
    else if (heartRate < 70 && skinConductance < 0.4) {
      emotions.happy = 0.6;
      emotions.neutral = 0.4;
    }

    const primaryEmotion = Object.keys(emotions).reduce((a, b) => 
      emotions[a] > emotions[b] ? a : b
    );

    return {
      emotions,
      primaryEmotion,
      confidence: 0.7
    };
  }

  // Process composite emotion from multiple sources
  async processCompositeEmotion(compositeData) {
    const results = [];
    
    if (compositeData.facial) {
      results.push(await this.processFacialEmotion(compositeData.facial));
    }
    if (compositeData.voice) {
      results.push(await this.processVoiceEmotion(compositeData.voice));
    }
    if (compositeData.text) {
      results.push(await this.processTextEmotion(compositeData.text));
    }
    if (compositeData.physiological) {
      results.push(await this.processPhysiologicalData(compositeData.physiological));
    }

    // Combine results with weighted average
    const combinedEmotions = this.combineEmotionResults(results);
    
    return combinedEmotions;
  }

  // Combine multiple emotion results
  combineEmotionResults(results) {
    const emotions = {
      happy: 0,
      sad: 0,
      angry: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 0
    };

    let totalConfidence = 0;

    results.forEach(result => {
      const weight = result.confidence || 1;
      totalConfidence += weight;
      
      Object.keys(emotions).forEach(emotion => {
        emotions[emotion] += (result.emotions[emotion] || 0) * weight;
      });
    });

    // Normalize
    Object.keys(emotions).forEach(emotion => {
      emotions[emotion] /= totalConfidence;
    });

    const primaryEmotion = Object.keys(emotions).reduce((a, b) => 
      emotions[a] > emotions[b] ? a : b
    );

    return {
      emotions,
      primaryEmotion,
      confidence: totalConfidence / results.length
    };
  }

  // Calculate emotional complexity
  calculateEmotionalComplexity(emotions) {
    // Shannon entropy calculation
    let entropy = 0;
    const values = Object.values(emotions);
    const sum = values.reduce((a, b) => a + b, 0);

    if (sum === 0) return 0;

    values.forEach(value => {
      if (value > 0) {
        const p = value / sum;
        entropy -= p * Math.log2(p);
      }
    });

    // Normalize to 0-1 range
    const maxEntropy = Math.log2(Object.keys(emotions).length);
    return entropy / maxEntropy;
  }

  // Update user's emotion profile
  async updateUserEmotionProfile(userId, emotionRecord) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Update emotion history
      if (!user.emotionProfile) {
        user.emotionProfile = {
          emotionHistory: [],
          dominantEmotions: {},
          averageComplexity: 0
        };
      }

      // Add to history (keep last 100 records)
      user.emotionProfile.emotionHistory.push({
        emotionId: emotionRecord._id,
        timestamp: emotionRecord.timestamp,
        primaryEmotion: emotionRecord.primaryEmotion
      });

      if (user.emotionProfile.emotionHistory.length > 100) {
        user.emotionProfile.emotionHistory.shift();
      }

      // Update dominant emotions
      const emotionCounts = {};
      user.emotionProfile.emotionHistory.forEach(record => {
        emotionCounts[record.primaryEmotion] = (emotionCounts[record.primaryEmotion] || 0) + 1;
      });
      user.emotionProfile.dominantEmotions = emotionCounts;

      // Update average complexity
      const recentEmotions = await EmotionData.find({ userId })
        .sort({ timestamp: -1 })
        .limit(50);
      
      const avgComplexity = recentEmotions.reduce((sum, e) => sum + e.emotionalComplexity, 0) / recentEmotions.length;
      user.emotionProfile.averageComplexity = avgComplexity;

      await user.save();
    } catch (error) {
      logger.error('Error updating user emotion profile:', error);
    }
  }

  // Generate emotion insights
  async generateEmotionInsights(userId, currentEmotion) {
    try {
      // Get recent emotion history
      const recentEmotions = await EmotionData.find({ userId })
        .sort({ timestamp: -1 })
        .limit(10);

      const insights = [];

      // Check for emotion patterns
      if (recentEmotions.length >= 5) {
        const emotionTrend = this.detectEmotionTrend(recentEmotions);
        if (emotionTrend) {
          insights.push({
            type: 'trend',
            message: emotionTrend.message,
            priority: emotionTrend.priority,
            metadata: emotionTrend.metadata
          });
        }
      }

      // Check emotional stability
      const stability = this.calculateEmotionalStability(recentEmotions);
      if (stability < 0.3) {
        insights.push({
          type: 'warning',
          message: 'Your emotions have been quite variable recently. Consider taking some time for mindfulness or relaxation.',
          priority: 'high',
          recommendation: 'Try meditation or breathing exercises'
        });
      }

      // Context-based insights
      if (currentEmotion.context?.activity) {
        const contextInsight = await this.generateContextBasedInsight(currentEmotion);
        if (contextInsight) {
          insights.push(contextInsight);
        }
      }

      return insights;
    } catch (error) {
      logger.error('Error generating insights:', error);
      return [];
    }
  }

  // Detect emotion trends
  detectEmotionTrend(emotions) {
    const recentEmotions = emotions.slice(0, 5);
    const emotionCounts = {};
    
    recentEmotions.forEach(e => {
      emotionCounts[e.primaryEmotion] = (emotionCounts[e.primaryEmotion] || 0) + 1;
    });

    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    if (emotionCounts[dominantEmotion] >= 4) {
      return {
        message: `You've been feeling ${dominantEmotion} frequently lately`,
        priority: dominantEmotion === 'sad' || dominantEmotion === 'angry' ? 'high' : 'medium',
        metadata: {
          dominantEmotion,
          frequency: emotionCounts[dominantEmotion]
        }
      };
    }

    return null;
  }

  // Calculate emotional stability
  calculateEmotionalStability(emotions) {
    if (emotions.length < 2) return 1;

    let changes = 0;
    for (let i = 1; i < emotions.length; i++) {
      if (emotions[i].primaryEmotion !== emotions[i-1].primaryEmotion) {
        changes++;
      }
    }

    return 1 - (changes / (emotions.length - 1));
  }

  // Generate context-based insight
  async generateContextBasedInsight(emotion) {
    const { context, primaryEmotion } = emotion;
    
    if (context.activity === 'work' && primaryEmotion === 'stressed') {
      return {
        type: 'suggestion',
        message: 'Work seems to be causing stress. Consider taking short breaks throughout the day.',
        priority: 'medium',
        recommendation: 'Try the Pomodoro technique for better work-life balance'
      };
    }

    if (context.activity === 'social' && primaryEmotion === 'happy') {
      return {
        type: 'success',
        message: 'Social interactions are boosting your mood! Keep nurturing these connections.',
        priority: 'low'
      };
    }

    return null;
  }

  // Get mock emotion data for testing
  getMockEmotionData() {
    const emotions = {
      happy: Math.random() * 0.3,
      sad: Math.random() * 0.3,
      angry: Math.random() * 0.3,
      fear: Math.random() * 0.3,
      surprise: Math.random() * 0.3,
      disgust: Math.random() * 0.3,
      neutral: Math.random() * 0.4 + 0.3
    };

    // Normalize
    const sum = Object.values(emotions).reduce((a, b) => a + b, 0);
    Object.keys(emotions).forEach(key => {
      emotions[key] = emotions[key] / sum;
    });

    const primaryEmotion = Object.keys(emotions).reduce((a, b) => 
      emotions[a] > emotions[b] ? a : b
    );

    return {
      emotions,
      primaryEmotion,
      confidence: 0.6 + Math.random() * 0.3
    };
  }

  // Get emotion analytics
  async getEmotionAnalytics(userId, period = '7d') {
    try {
      const dateFilter = this.getDateFilterFromPeriod(period);
      
      const emotions = await EmotionData.find({
        userId,
        timestamp: { $gte: dateFilter }
      }).sort({ timestamp: -1 });

      // Calculate emotion breakdown
      const emotionBreakdown = {};
      const emotionTrends = {};
      let totalComplexity = 0;

      emotions.forEach(emotion => {
        // Update breakdown
        Object.keys(emotion.emotions).forEach(e => {
          emotionBreakdown[e] = (emotionBreakdown[e] || 0) + emotion.emotions[e];
        });

        // Update trends by day
        const day = emotion.timestamp.toISOString().split('T')[0];
        if (!emotionTrends[day]) {
          emotionTrends[day] = {
            happy: 0, sad: 0, angry: 0, fear: 0, 
            surprise: 0, disgust: 0, neutral: 0
          };
        }
        Object.keys(emotion.emotions).forEach(e => {
          emotionTrends[day][e] += emotion.emotions[e];
        });

        totalComplexity += emotion.emotionalComplexity;
      });

      // Normalize breakdown
      const totalEmotions = emotions.length || 1;
      Object.keys(emotionBreakdown).forEach(e => {
        emotionBreakdown[e] /= totalEmotions;
      });

      // Find dominant emotion
      const dominantEmotion = Object.keys(emotionBreakdown).reduce((a, b) => 
        emotionBreakdown[a] > emotionBreakdown[b] ? a : b, 'neutral'
      );

      return {
        totalCount: emotions.length,
        emotionBreakdown,
        dominantEmotion,
        trends: emotionTrends,
        averageComplexity: totalComplexity / totalEmotions,
        emotionalStability: this.calculateEmotionalStability(emotions)
      };
    } catch (error) {
      logger.error('Error getting emotion analytics:', error);
      throw error;
    }
  }

  // Get date filter from period
  getDateFilterFromPeriod(period) {
    const now = new Date();
    const periodMap = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const days = periodMap[period] || 7;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
}

module.exports = new EmotionService();
