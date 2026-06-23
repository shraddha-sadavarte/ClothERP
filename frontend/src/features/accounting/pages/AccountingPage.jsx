import { Box, Typography, Paper } from '@mui/material';

export default function AccountingPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Accounting & Finance
      </Typography>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          🚧 Accounting ledgers and GST reports are coming soon.
        </Typography>
      </Paper>
    </Box>
  );
}
