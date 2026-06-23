import { Box, Typography, Paper } from '@mui/material';

export default function AdminPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        System Configuration
      </Typography>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          🚧 Admin settings and configurations are under development.
        </Typography>
      </Paper>
    </Box>
  );
}
