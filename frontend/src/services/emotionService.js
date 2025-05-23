import api from './api';

class EmotionService {
  // Process emotion data
  async processEmotion(emotionData) {
    const response = await api.post('/emotions/process', emotionData);
    return response.data;
  }

  // Get emotion history
  async getEmotionHistory(startDate, endDate) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/emotions/history', { params });
    return response.data;
  }

  // Get emotion analytics
  async getEmotionAnalytics(period = '7d') {
    const response = await api.get('/emotions/analytics', { 
      params: { period } 
    });
    return response.data;
  }

  // Get emotion insights
  async getEmotionInsights(limit = 10) {
    const response = await api.get('/emotions/insights', { 
      params: { limit } 
    });
    return response.data;
  }

  // Delete emotion data
  async deleteEmotionData(emotionId) {
    const response = await api.delete(`/emotions/${emotionId}`);
    return response.data;
  }

  // Anonymize emotion data
  async anonymizeEmotionData(emotionId) {
    const response = await api.post(`/emotions/${emotionId}/anonymize`);
    return response.data;
  }

  // Update privacy settings
  async updatePrivacySettings(emotionId, settings) {
    const response = await api.put(`/emotions/${emotionId}/privacy`, settings);
    return response.data;
  }

  // Get emotional complexity
  async getEmotionalComplexity(emotionId) {
    const response = await api.get(`/emotions/${emotionId}/complexity`);
    return response.data;
  }

  // Process facial emotion from image
  async processFacialEmotion(imageData) {
    const response = await api.post('/emotions/process', {
      dataType: 'facial',
      rawData: {
        facial: imageData
      }
    });
    return response.data;
  }

  // Process voice emotion from audio
  async processVoiceEmotion(audioData) {
    const response = await api.post('/emotions/process', {
      dataType: 'voice',
      rawData: {
        voice: audioData
      }
    });
    return response.data;
  }

  // Process text emotion
  async processTextEmotion(text) {
    const response = await api.post('/emotions/process', {
      dataType: 'text',
      rawData: {
        text: {
          content: text
        }
      }
    });
    return response.data;
  }

  // Process composite emotion (multiple modalities)
  async processCompositeEmotion(emotionData) {
    const response = await api.post('/emotions/process', {
      dataType: 'composite',
      rawData: emotionData
    });
    return response.data;
  }

  // Get emotion trends
  async getEmotionTrends(period = '30d') {
    const analytics = await this.getEmotionAnalytics(period);
    return analytics.data?.trends || {};
  }

  // Get dominant emotion
  async getDominantEmotion(period = '7d') {
    const analytics = await this.getEmotionAnalytics(period);
    return analytics.data?.dominantEmotion || 'neutral';
  }

  // Get emotional stability score
  async getEmotionalStability(period = '7d') {
    const analytics = await this.getEmotionAnalytics(period);
    return analytics.data?.emotionalStability || 0;
  }
}

export default new EmotionService();
