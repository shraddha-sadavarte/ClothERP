import api from '../../services/api';

export const userApi = {
  getCurrentUser: () => api.get('/auth/me'),
  listUsers: (page = 0, size = 20) =>
    api.get('/users', { params: { page, size } }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, payload) => api.put(`/users/${id}`, payload),
};