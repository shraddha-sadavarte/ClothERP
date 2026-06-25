import { Box, Grid, Paper, Typography, Chip, Stack, Button } from '@mui/material';
import {
  Settings,
  Storefront,
  People,
  History,
  Backup,
  Security,
  Dashboard,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../../../hooks/usePermission';
import PageHeader from '../../../components/common/PageHeader';

const adminModules = [
  {
    title: 'Branches',
    icon: <Storefront fontSize="large" />,
    color: '#10b981',
    description: 'Manage branches and locations',
    path: '/admin/branches',
    status: 'Ready',
  },
  {
    title: 'Users',
    icon: <People fontSize="large" />,
    color: '#8b5cf6',
    description: 'Manage system users and roles',
    path: '/users',
    status: 'Ready',
  },
  {
    title: 'System Settings',
    icon: <Settings fontSize="large" />,
    color: '#3b82f6',
    description: 'Manage application configurations',
    path: '/admin/settings',
    status: 'Ready',
  },
  {
    title: 'Audit Logs',
    icon: <History fontSize="large" />,
    color: '#f59e0b',
    description: 'View system activity logs',
    path: '/admin/audit',
    status: 'Coming Soon',
  },
  {
    title: 'Backup & Restore',
    icon: <Backup fontSize="large" />,
    color: '#ef4444',
    description: 'Database backup and restore',
    path: '/admin/backup',
    status: 'Planned',
  },
  {
    title: 'Security',
    icon: <Security fontSize="large" />,
    color: '#64748b',
    description: 'Security settings and permissions',
    path: '/admin/security',
    status: 'Planned',
  },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const isSuperAdmin = usePermission('ALL');

  if (!isSuperAdmin) {
    return (
      <Box>
        <PageHeader
          title="Access Denied"
          subtitle="You do not have permission to view this page."
        />
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" color="error">
            ⛔ Only SUPER_ADMIN can access the Admin panel.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Admin Panel"
        subtitle="System configuration and management"
      />

      <Grid container spacing={3}>
        {adminModules.map((mod) => (
          <Grid item xs={12} sm={6} md={4} key={mod.title}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                opacity: mod.status === 'Planned' || mod.status === 'Coming Soon' ? 0.8 : 1,
                cursor: mod.status === 'Ready' ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (mod.status === 'Ready') {
                  navigate(mod.path);
                }
              }}
            >
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: mod.color + '18',
                      color: mod.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {mod.icon}
                  </Box>
                  <Chip
                    label={mod.status}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      backgroundColor:
                        mod.status === 'Ready'
                          ? '#d1fae5'
                          : mod.status === 'Coming Soon'
                          ? '#fff3cd'
                          : '#e2e8f0',
                      color:
                        mod.status === 'Ready'
                          ? '#065f46'
                          : mod.status === 'Coming Soon'
                          ? '#856404'
                          : '#4a5568',
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  {mod.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mod.description}
                </Typography>
                {mod.status === 'Ready' && (
                  <Button
                    size="small"
                    variant="text"
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(mod.path);
                    }}
                  >
                    Manage →
                  </Button>
                )}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* System overview card (dummy stats – replace with real data later) */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Dashboard fontSize="large" color="primary" />
        <Typography variant="body2" color="text.secondary">
          System overview will appear here. For now, use the modules above to manage your system.
          <br />
          <strong>✅ Branches module is now fully functional!</strong>
        </Typography>
      </Paper>
    </Box>
  );
}