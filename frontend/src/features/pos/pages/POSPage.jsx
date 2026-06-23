import { Box, Typography, Paper } from '@mui/material';

export default function POSPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Point of Sale (POS)
      </Typography>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          🚧 POS Terminal Module is currently under construction.
        </Typography>
      </Paper>
    </Box>
  );
}
