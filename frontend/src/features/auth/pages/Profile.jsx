import { useAuth } from '../../../hooks/useAuth';
import { Box, Typography, Paper, Chip } from '@mui/material';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return <Typography>Not logged in</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Profile</Typography>
      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography><strong>Username:</strong> {user.username}</Typography>
        <Typography><strong>Email:</strong> {user.email}</Typography>
        <Typography><strong>Role:</strong> {user.role}</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Permissions:</Typography>
          {user.permissions?.map((p) => (
            <Chip key={p} label={p} size="small" sx={{ mr: 1, mt: 1 }} />
          ))}
        </Box>
      </Paper>
    </Box>
  );
}