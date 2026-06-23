import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { authApi } from '../features/auth/authApi';
import { authStart, authSuccess, authFailure, logout as logoutAction } from '../features/auth/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const login = useCallback(
    async (username, password) => {
      dispatch(authStart());
      try {
        const response = await authApi.login(username, password);
        const result = response.data;
        dispatch(authSuccess(result));
        return { success:true, data: result };
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Login failed';
        dispatch(authFailure(message));
        return { success: false, error: message, raw: err };
      }
    },
    [dispatch]
  );

  const register = useCallback(
    async (payload) => {
      dispatch(authStart());
      try {
        const response = await authApi.register(payload);
        const result = response.data;
        dispatch(authSuccess(result));
        return { success: true, data: result };
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Registration failed';
        dispatch(authFailure(message));
        return { success: false, error: message, raw: err };
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      if (auth.refreshToken) await authApi.logout(auth.refreshToken);
    } catch {
      // proceed with local logout regardless of server response
    } finally {
      dispatch(logoutAction());
    }
  }, [dispatch, auth.refreshToken]);

  return {
    ...auth,
    isAuthenticated: auth.status === 'authenticated' && !!auth.accessToken,
    isInitialized: auth.isInitialized,
    login,
    register,
    logout,
  };
}