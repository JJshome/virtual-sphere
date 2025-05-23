import api from './api';

class DynamicWorldService {
  // Create a new world
  async createWorld(worldData) {
    const response = await api.post('/worlds/create', worldData);
    return response.data;
  }

  // Get world by ID
  async getWorld(worldId) {
    const response = await api.get(`/worlds/${worldId}`);
    return response.data;
  }

  // Update world settings
  async updateWorld(worldId, updates) {
    const response = await api.put(`/worlds/${worldId}`, updates);
    return response.data;
  }

  // Get active worlds
  async getActiveWorlds(limit = 10) {
    const response = await api.get('/worlds/active', { params: { limit } });
    return response.data;
  }

  // Search worlds
  async searchWorlds(query, type, limit = 20) {
    const response = await api.get('/worlds/search', { 
      params: { query, type, limit } 
    });
    return response.data;
  }

  // Get user's worlds
  async getUserWorlds() {
    const response = await api.get('/worlds/my-worlds');
    return response.data;
  }

  // Join a world
  async joinWorld(worldId) {
    const response = await api.post(`/worlds/${worldId}/join`);
    return response.data;
  }

  // Leave a world
  async leaveWorld(worldId) {
    const response = await api.post(`/worlds/${worldId}/leave`);
    return response.data;
  }

  // Add structure to world
  async addStructure(worldId, structureData) {
    const response = await api.post(`/worlds/${worldId}/structures`, structureData);
    return response.data;
  }

  // Update structure
  async updateStructure(worldId, structureId, updates) {
    const response = await api.put(`/worlds/${worldId}/structures/${structureId}`, updates);
    return response.data;
  }

  // Delete structure
  async deleteStructure(worldId, structureId) {
    const response = await api.delete(`/worlds/${worldId}/structures/${structureId}`);
    return response.data;
  }

  // Add dynamic rule
  async addDynamicRule(worldId, ruleData) {
    const response = await api.post(`/worlds/${worldId}/rules`, ruleData);
    return response.data;
  }

  // Get evolution history
  async getEvolutionHistory(worldId, limit = 50) {
    const response = await api.get(`/worlds/${worldId}/evolution`, { 
      params: { limit } 
    });
    return response.data;
  }

  // Get world statistics
  async getWorldStatistics(worldId) {
    const response = await api.get(`/worlds/${worldId}/statistics`);
    return response.data;
  }

  // Update collective emotion
  async updateCollectiveEmotion(worldId, emotionContribution) {
    const response = await api.post(`/worlds/${worldId}/emotion`, { 
      emotionContribution 
    });
    return response.data;
  }
}

export default new DynamicWorldService();
