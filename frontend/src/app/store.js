import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  devTools: typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV !== 'production',
});