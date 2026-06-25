import { Box, Container, Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        p: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center' }}>
        <Paper
          elevation={isMobile ? 0 : 8}
          sx={{
            width: '100%',
            p: { xs: 3, sm: 5 },
            borderRadius: { xs: 0, sm: 4 },
            backgroundColor: theme.palette.background.paper,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative accents */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 160,
              height: 160,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 200,
              height: 200,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.secondary.main, 0.06),
              pointerEvents: 'none',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Brand header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h5"
                fontWeight={700}
                color="primary"
                sx={{ letterSpacing: -0.5 }}
              >
                ClothERP
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Enterprise Resource Planning
              </Typography>
            </Box>

            {/* Page content (Login / Register) */}
            <Outlet />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}