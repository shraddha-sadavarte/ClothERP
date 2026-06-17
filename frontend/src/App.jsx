import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './app/theme';
import { useAuth } from './hooks/useAuth';
import { initializeAuth } from './features/auth/authSlice';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import UserList from './features/users/pages/UserList';
import Profile from './features/auth/pages/Profile';

// Protected route wrapper using useEffect to redirect
function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if(!isInitialized) return; // Wait for auth initialization
    if (!isAuthenticated) {
      // Save the attempted location for redirection after login
      navigate('/auth/login', { replace: true, state: { from: location } });
    }
  }, [isAuthenticated, isInitialized, navigate, location]);

  // Show loader only while initializing auth
  if(!isInitialized) {
    return <div>Loading...</div>
  }

  return isAuthenticated ? children : null;
}

// Initialize auth on app load
function AppInitializer({ children }) {
  const dispatch = useDispatch();
  const { isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isInitialized]);

  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppInitializer>
          <Routes>
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/users" replace />} />
              <Route path="users" element={<UserList />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/auth/login" replace />} /> {/* fallback to login */}
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;