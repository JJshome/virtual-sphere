import api from './api';

class VirtualHumanService {
  // Create virtual human
  async create(data) {
    const response = await api.post('/virtual-humans/create', data);
    return response.data;
  }

  // Get my virtual human
  async getMyVirtualHuman() {
    const response = await api.get('/virtual-humans/me');
    return response.data;
  }

  // Update virtual human
  async update(data) {
    const response = await api.put('/virtual-humans/update', data);
    return response.data;
  }

  // Get activities
  async getActivities(params = {}) {
    const response = await api.get('/virtual-humans/activities', { params });
    return response.data;
  }

  // Get relationships
  async getRelationships() {
    const response = await api.get('/virtual-humans/relationships');
    return response.data;
  }

  // Get emotional state
  async getEmotionalState() {
    const response = await api.get('/virtual-humans/emotional-state');
    return response.data;
  }

  // Update emotional state
  async updateEmotionalState(emotionData) {
    const response = await api.post('/virtual-humans/emotional-state', { emotionData });
    return response.data;
  }

  // Get evolution history
  async getEvolutionHistory() {
    const response = await api.get('/virtual-humans/evolution-history');
    return response.data;
  }

  // Trigger evolution
  async evolve(changes, trigger) {
    const response = await api.post('/virtual-humans/evolve', { changes, trigger });
    return response.data;
  }

  // Deactivate virtual human
  async deactivate() {
    const response = await api.post('/virtual-humans/deactivate');
    return response.data;
  }

  // Reactivate virtual human
  async reactivate() {
    const response = await api.post('/virtual-humans/reactivate');
    return response.data;
  }

  // Get statistics
  async getStatistics() {
    const response = await api.get('/virtual-humans/statistics');
    return response.data;
  }
}

export default new VirtualHumanService();
