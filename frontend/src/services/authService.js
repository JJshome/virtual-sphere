import api from './api';

class AuthService {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data.data;
  }

  async updateProfile(userData) {
    const response = await api.put('/users/profile', userData);
    return response.data;
  }

  async changePassword(oldPassword, newPassword) {
    const response = await api.put('/users/password', {
      oldPassword,
      newPassword
    });
    return response.data;
  }

  async resetPassword(email) {
    const response = await api.post('/auth/reset-password', { email });
    return response.data;
  }

  async verifyResetToken(token) {
    const response = await api.post('/auth/verify-reset-token', { token });
    return response.data;
  }

  async setNewPassword(token, password) {
    const response = await api.post('/auth/set-new-password', {
      token,
      password
    });
    return response.data;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();
