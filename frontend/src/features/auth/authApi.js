import api from '../../services/api';

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (payload) => api.post('/auth/register', payload),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  getMe: () => api.get('/auth/me'),
};