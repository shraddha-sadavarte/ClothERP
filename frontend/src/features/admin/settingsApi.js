import api from '../../services/api';

export const settingsApi = {
  // GET /api/v1/admin/settings
  list: () => api.get('/admin/settings'),

  // POST /api/v1/admin/settings
  createOrUpdate: (payload) => api.post('/admin/settings', payload),

  // DELETE /api/v1/admin/settings/:id
  delete: (id) => api.delete(`/admin/settings/${id}`),
};