import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Avatar,
  Alert,
  useTheme,
} from '@mui/material';
import {
  People,
  AdminPanelSettings,
  Store,
  Inventory,
  PointOfSale,
  AccountBalance,
  Category,
} from '@mui/icons-material';

const rolePermissionMap = {
  SUPER_ADMIN: { color: '#7c3aed', bg: '#ede9fe', label: 'Super Administrator' },
  OWNER: { color: '#0369a1', bg: '#e0f2fe', label: 'Owner' },
  BRANCH_MANAGER: { color: '#0891b2', bg: '#cffafe', label: 'Branch Manager' },
  SALES_EXECUTIVE: { color: '#16a34a', bg: '#dcfce7', label: 'Sales Executive' },
  CASHIER: { color: '#d97706', bg: '#fef3c7', label: 'Cashier' },
  PURCHASE_MANAGER: { color: '#dc2626', bg: '#fee2e2', label: 'Purchase Manager' },
  WAREHOUSE_MANAGER: { color: '#7c3aed', bg: '#f3e8ff', label: 'Warehouse Manager' },
  ACCOUNTANT: { color: '#059669', bg: '#d1fae5', label: 'Accountant' },
};

const moduleCards = [
  {
    label: 'Products',
    icon: <Category />,
    permission: 'PRODUCT_VIEW',
    color: '#0891b2',
    desc: 'Manage product catalog',
    path: '/products',
  },
  {
    label: 'Users',
    icon: <People />,
    permission: 'USER_VIEW',
    color: '#3b82f6',
    desc: 'Manage system users and roles',
    path: '/users',
  },
  {
    label: 'Sales',
    icon: <Store />,
    permission: 'SALES_VIEW',
    color: '#10b981',
    desc: 'View and create sales orders',
    path: '/sales',
  },
  {
    label: 'POS Billing',
    icon: <PointOfSale />,
    permission: 'POS_BILLING',
    color: '#f59e0b',
    desc: 'Point-of-sale billing terminal',
    path: '/pos',
  },
  {
    label: 'Inventory',
    icon: <Inventory />,
    permission: 'INVENTORY_VIEW',
    color: '#8b5cf6',
    desc: 'Stock and warehouse management',
    path: '/inventory',
  },
  {
    label: 'Accounting',
    icon: <AccountBalance />,
    permission: 'ACCOUNTING_VIEW',
    color: '#ef4444',
    desc: 'Ledger, GST and finance reports',
    path: '/accounting',
  },
  {
    label: 'Admin',
    icon: <AdminPanelSettings />,
    permission: 'ALL',
    color: '#64748b',
    desc: 'System configuration (Branches, Settings)',
    path: '/admin',
  },
];

export default function DashboardHome() {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const permissions = user?.permissions || [];
  const hasPermission = (p) => permissions.includes('ALL') || permissions.includes(p);
  const roleInfo = rolePermissionMap[user?.role] || {};

  const accessibleModules = moduleCards.filter((m) => hasPermission(m.permission));

  return (
    <Box>
      {/* Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 4,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: '#fff',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 2,
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Welcome back, {user?.username} 👋
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: { xs: 'center', sm: 'flex-start' },
                gap: 1,
                mt: 0.5,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={roleInfo.label || user?.role}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={user?.email}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Module Access Cards */}
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Your Modules
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {accessibleModules.map((mod) => (
          <Grid item xs={12} sm={6} md={4} key={mod.label}>
            <Paper
              elevation={0}
              onClick={() => navigate(mod.path)}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: 4,
                },
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: mod.color + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: mod.color,
                  }}
                >
                  {mod.icon}
                </Box>
                <Box>
                  <Typography fontWeight={700}>{mod.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {mod.desc}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
        {accessibleModules.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">No modules accessible for your role yet.</Alert>
          </Grid>
        )}
      </Grid>

      {/* Permissions Panel */}
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Your Permissions
      </Typography>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {permissions.map((p) => (
            <Chip
              key={p}
              label={p}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
}