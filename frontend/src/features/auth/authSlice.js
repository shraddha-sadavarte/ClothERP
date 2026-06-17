import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'clotherp_session';

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const persisted = loadPersisted();

const initialState = {
  user: persisted?.user ?? null, // UserDTO: { id, username, email, role, branchId, active, permissions }
  accessToken: persisted?.accessToken ?? null,
  refreshToken: persisted?.refreshToken ?? null,
  status: 'idle', // Always start as idle for initialization
  isInitialized: false, // Track if auth check is complete
  error: null,
};

function persist(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken })
  );
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuth(state) {
      // Called on app mount to restore persisted session
      if (persisted?.accessToken) {
        state.user = persisted.user;
        state.accessToken = persisted.accessToken;
        state.refreshToken = persisted.refreshToken;
        state.status = 'authenticated';
      } else {
        state.status = 'unauthenticated';
      }
      state.isInitialized = true;
      state.error = null;
    },
    authStart(state) {
      state.status = 'loading';
      state.error = null;
    },
    authSuccess(state, action) {
      // action.payload is the full AuthResponse: { accessToken, refreshToken, user }
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.status = 'authenticated';
      state.isInitialized = true;
      persist(state);
    },
    authFailure(state, action) {
      state.status = 'unauthenticated';
      state.isInitialized = true;
      state.error = action.payload;
    },
    setTokens(state, action) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      persist(state);
    },
    setCurrentUser(state, action) {
      state.user = action.payload;
      persist(state);
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = 'unauthenticated';
      state.isInitialized = true;
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { initializeAuth, authStart, authSuccess, authFailure, setTokens, setCurrentUser, logout } = authSlice.actions;
export default authSlice.reducer;