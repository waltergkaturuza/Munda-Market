import { createTheme, PaletteMode } from '@mui/material/styles';

export const getTheme = (mode: PaletteMode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#4caf50' : '#2e7d32',
        light: '#66bb6a',
        dark: '#1b5e20',
        contrastText: '#ffffff',
      },
      secondary: {
        main: mode === 'dark' ? '#ff9800' : '#f57c00',
        light: '#ffb74d',
        dark: '#e65100',
        contrastText: '#ffffff',
      },
      error: {
        main: '#d32f2f',
      },
      warning: {
        main: '#f57c00',
      },
      info: {
        main: '#0288d1',
      },
      success: {
        main: '#388e3c',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow:
              mode === 'dark'
                ? '0 2px 8px rgba(0,0,0,0.4)'
                : '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  });
};

