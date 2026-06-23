import api from '../../services/api';

export const salesApi = {
  // GET /api/v1/sales?page=0&size=20
  listOrders: (page = 0, size = 20) =>
    api.get('/sales', { params: { page, size, sort: 'createdAt,desc' } }),

  // GET /api/v1/sales/:id
  getById: (id) => api.get(`/sales/${id}`),

  // POST /api/v1/sales
  createOrder: (payload) => api.post('/sales', payload),

  // PATCH /api/v1/sales/:id/status
  updateStatus: (id, payload) => api.patch(`/sales/${id}/status`, payload),

  // DELETE /api/v1/sales/:id
  cancelOrder: (id) => api.delete(`/sales/${id}`),
};
