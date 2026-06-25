import api from '../../services/api';

export const branchApi = {
  listActive: () => api.get('/branches'),
  create: (payload) => api.post('/branches', payload),
  update: (id, payload) => api.put(`/branches/${id}`, payload),
  deactivate: (id) => api.delete(`/branches/${id}`),
};