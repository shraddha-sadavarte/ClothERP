import api from '../../services/api';

export const inventoryApi = {
  // GET /api/v1/inventory/branch/:branchId
  getStockByBranch: (branchId) =>
    api.get(`/inventory/branch/${branchId}`),

  // GET /api/v1/inventory/product/:productId/branch/:branchId
  getStockByProductAndBranch: (productId, branchId) =>
    api.get(`/inventory/product/${productId}/branch/${branchId}`),

  // GET /api/v1/inventory/low-stock?branchId=...&threshold=...
  getLowStock: (branchId, threshold = 5) =>
    api.get('/inventory/low-stock', { params: { branchId, threshold } }),

  // GET /api/v1/inventory/transactions/branch/:branchId
  getTransactionsByBranch: (branchId, page = 0, size = 20) =>
    api.get(`/inventory/transactions/branch/${branchId}`, {
      params: { page, size, sort: 'createdAt,desc' },
    }),

  // GET /api/v1/inventory/transactions/product/:productId
  getTransactionsByProduct: (productId, page = 0, size = 20) =>
    api.get(`/inventory/transactions/product/${productId}`, {
      params: { page, size, sort: 'createdAt,desc' },
    }),

  // POST /api/v1/inventory/adjust
  adjustStock: (payload) => api.post('/inventory/adjust', payload),

  // POST /api/v1/inventory/transfer
  transferStock: (payload) => api.post('/inventory/transfer', payload),
};