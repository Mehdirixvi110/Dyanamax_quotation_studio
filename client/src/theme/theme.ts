import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1B3A5C',
      light: '#2E5A8A',
      dark: '#0F2440',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E8A838',
      light: '#F0C060',
      dark: '#C08820',
      contrastText: '#000000',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
    },
    success: {
      main: '#2E7D32',
    },
    warning: {
      main: '#ED6C02',
    },
    info: {
      main: '#0288D1',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#5F6368',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.25rem' },
    h2: { fontWeight: 700, fontSize: '1.875rem' },
    h3: { fontWeight: 600, fontSize: '1.5rem' },
    h4: { fontWeight: 600, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.1rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          '&.MuiButton-containedPrimary': {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(27, 58, 92, 0.3)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E8ECF0',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F5F7FA',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#1A1A1A',
          },
        },
      },
    },
  },
});
