import { Box, Typography, Paper, Chip, Stack } from '@mui/material';
import { useAuth } from '../../../hooks/useAuth';
import PageHeader from '../../../components/common/PageHeader';

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Box>
        <PageHeader title="Profile" subtitle="User profile information" />
        <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
          <Typography color="text.secondary">Not logged in</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="View your account details and permissions" />

      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 700,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
              Username
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.username}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {user.email}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
              Role
            </Typography>
            <Chip label={user.role} color="primary" variant="outlined" />
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
              Status
            </Typography>
            <Chip
              label={user.active ? 'Active' : 'Inactive'}
              color={user.active ? 'success' : 'error'}
              size="small"
            />
          </Box>
          {user.branchId && (
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                Branch
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {user.branchId} {/* You can replace with branch name if you fetch branches */}
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary" gutterBottom>
              Permissions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {user.permissions?.length ? (
                user.permissions.map((p) => (
                  <Chip key={p} label={p} size="small" variant="outlined" />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No permissions assigned.
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}