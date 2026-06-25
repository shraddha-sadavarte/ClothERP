import { Backdrop, CircularProgress, Typography } from '@mui/material';

/**
 * Full‑page loading overlay with optional message.
 */
export default function LoadingOverlay({ open, message = 'Loading...' }) {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: 9999,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <CircularProgress color="inherit" size={48} />
      {message && (
        <Typography variant="body1" fontWeight={500}>
          {message}
        </Typography>
      )}
    </Backdrop>
  );
}