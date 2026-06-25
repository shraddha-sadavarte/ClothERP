import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './app/theme';
import { useAuth } from './hooks/useAuth';
import { initializeAuth } from './features/auth/authSlice';
import AuthLayout from './components/layouts/AuthLayout';
import DashboardLayout from './components/layouts/DashboardLayout';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import UserList from './features/users/pages/UserList';
import Profile from './features/auth/pages/Profile';
import DashboardHome from './features/dashboard/DashboardHome';
import InventoryPage from './features/inventory/pages/InventoryPage';
import SalesOrderList from './features/sales/pages/SalesOrderList';
import ProductList from './features/products/pages/ProductList';
import POSPage from './features/pos/pages/POSPage';
import AccountingPage from './features/accounting/pages/AccountingPage';
import AdminPage from './features/admin/pages/AdminPage';
import BranchList from './features/branch/pages/BranchList';
import SystemSettingsPage from './features/admin/pages/SystemSettingsPage';

// Protected route wrapper using useEffect to redirect
function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if(!isInitialized) return; // Wait for auth initialization
    if (!isAuthenticated) {
      navigate('/auth/login', { replace: true, state: { from: location } });
    }
  }, [isAuthenticated, isInitialized, navigate, location]);

  if(!isInitialized) {
    return <div>Loading...</div>;
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
              <Route index element={<DashboardHome />} />
              <Route path="users" element={<UserList />} />
              <Route path="profile" element={<Profile />} />
              
              {/* Core feature routes */}
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="sales" element={<SalesOrderList />} />
              <Route path="products" element={<ProductList />} />
              <Route path="pos" element={<POSPage />} />
              <Route path="accounting" element={<AccountingPage />} />

              {/* Admin sub‑routes */}
              <Route path="admin" element={<AdminPage />} />
              <Route path="admin/branches" element={<BranchList />} />
              {/* Future admin routes */}
              <Route path="admin/settings" element={<SystemSettingsPage />} />
              <Route path="admin/audit" element={<div>Audit logs coming soon</div>} />
            </Route>

            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;