import api from '../../services/api';

export const posApi = {
  // GET /api/v1/pos/products?search=...
  searchProducts: (search, branchId) =>
    api.get('/pos/products', { params: { search, branchId } }),

  // GET /api/v1/pos/customers?search=...
  searchCustomers: (search = '') =>
    api.get('/pos/customers', { params: { search } }),

  // POST /api/v1/pos/checkout
  checkout: (payload) => api.post('/pos/checkout', payload),

  // GET /api/v1/pos/sessions
  getSession: () => api.get('/pos/sessions'),
};