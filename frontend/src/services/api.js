// frontend/src/services/api.js
import axios from 'axios';
import { store } from '../app/store';
import { setTokens, logout } from '../features/auth/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { accessToken } = store.getState().auth;
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (response) => {
    // ✅ Check if it's a blob response - return as is
    if (response.config.responseType === 'blob') {
      console.log('📥 Blob response detected, returning raw data');
      return response.data;
    }

    // ✅ Check if it's an arraybuffer response
    if (response.config.responseType === 'arraybuffer') {
      return response.data;
    }

    // Always unwrap the data from ApiResponse if it's a success
    if (response.data && response.data.success !== undefined) {
      if (response.data.success) {
        return response.data.data; // ✅ payload only
      } else {
        // If success is false, treat as an error
        return Promise.reject({
          response: {
            data: response.data,
            status: response.data.statusCode || 500,
          },
        });
      }
    }
    // Fallback
    return response.data;
  },
  async (error) => {
    const original = error.config;
    const isAuthEndpoint =
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register') ||
      original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      const { refreshToken } = store.getState().auth;
      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject })).then(
          (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            original._retry = true;
            return api(original);
          }
        );
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const res = await api.post('/auth/refresh', { refreshToken });
        // res is already the unwrapped payload { accessToken, refreshToken }
        const newAccessToken = res.accessToken;
        const newRefreshToken = res.refreshToken;
        store.dispatch(setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken }));
        queue.forEach((p) => p.resolve(newAccessToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshErr) {
        queue.forEach((p) => p.reject(refreshErr));
        queue = [];
        store.dispatch(logout());
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;