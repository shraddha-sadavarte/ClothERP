import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#0b4f6c' },
        secondary: { main: '#f50057' },
        background: { default: '#f5f5f5' },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "sans-serif"',
    },
    shape: { borderRadius: 8 },
});

export default theme;