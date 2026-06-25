import { Box, Grid, Paper, Typography, Chip, Stack } from '@mui/material';
import {
  AccountBalance,
  Assessment,
  Receipt,
  TrendingUp,
  AttachMoney,
} from '@mui/icons-material';
import PageHeader from '../../../components/common/PageHeader';

const modules = [
  {
    title: 'General Ledger',
    icon: <AccountBalance fontSize="large" />,
    color: '#3b82f6',
    description: 'View and manage all ledger entries',
    status: 'Coming Soon',
  },
  {
    title: 'GST Reports',
    icon: <Receipt fontSize="large" />,
    color: '#10b981',
    description: 'GSTR-1, GSTR-3B and other GST filings',
    status: 'Planned',
  },
  {
    title: 'Profit & Loss',
    icon: <TrendingUp fontSize="large" />,
    color: '#f59e0b',
    description: 'Profit and loss statement',
    status: 'Coming Soon',
  },
  {
    title: 'Balance Sheet',
    icon: <AccountBalance fontSize="large" />,
    color: '#8b5cf6',
    description: 'Complete balance sheet overview',
    status: 'Planned',
  },
  {
    title: 'Cash Flow',
    icon: <AttachMoney fontSize="large" />,
    color: '#ef4444',
    description: 'Cash inflow and outflow analysis',
    status: 'Coming Soon',
  },
  {
    title: 'Tax Summary',
    icon: <Assessment fontSize="large" />,
    color: '#64748b',
    description: 'Tax liabilities and payments summary',
    status: 'Planned',
  },
];

export default function AccountingPage() {
  return (
    <Box>
      <PageHeader
        title="Accounting & Finance"
        subtitle="Manage ledgers, GST, and financial reports"
      />

      <Grid container spacing={3}>
        {modules.map((mod) => (
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
                opacity: mod.status === 'Coming Soon' ? 0.8 : 1,
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
                      backgroundColor: mod.status === 'Coming Soon' ? '#fff3cd' : '#e2e8f0',
                      color: mod.status === 'Coming Soon' ? '#856404' : '#4a5568',
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  {mod.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mod.description}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Optional: Placeholder for summary stats – will come from backend later */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          💡 Financial data will appear here once the accounting module is fully implemented.
          <br />
          Check back soon for live ledgers and GST reports.
        </Typography>
      </Paper>
    </Box>
  );
}