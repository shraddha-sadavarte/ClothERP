import api from '../../services/api';

export const productApi = {
  // GET /api/v1/products?page=0&size=20
  listProducts: (page = 0, size = 20) =>
    api.get('/products', { params: { page, size, sort: 'createdAt,desc' } }),

  // GET /api/v1/products/:id
  getById: (id) => api.get(`/products/${id}`),

  // GET /api/v1/products/sku/:sku
  getBySku: (sku) => api.get(`/products/sku/${sku}`),

  // POST /api/v1/products
  create: (payload) => api.post('/products', payload),

  // PUT /api/v1/products/:id
  update: (id, payload) => api.put(`/products/${id}`, payload),

  // DELETE /api/v1/products/:id
  delete: (id) => api.delete(`/products/${id}`),
};
