import { createTheme } from '@mui/material/styles';

// Brand colors sampled from the QMICS / TestSphere logos: deep teal + amber gold.
export const brand = {
  teal: '#1C7C8C',
  tealDark: '#0B2430',
  tealDarker: '#071820',
  amber: '#F5A623',
  amberLight: '#FFC259',
  amberDark: '#A85D00',
  // Light-blue surface used behind the auth pages — soft enough to stay
  // readable with dark text, but still clearly "TestSphere teal" tinted.
  skyLight: '#EAF6FC',
  sky: '#D3EAF6',
  skyDeep: '#AFDCEF',
  // Pixel-sampled directly from testsphere-logo.jpeg (navy fill of "Test",
  // gold fill of "Sphere") for surfaces that must match the logo exactly.
  logoNavy: '#0A3768',
  logoGold: '#FCC000',
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand.teal,
      dark: '#0F4C56',
      light: '#4FA8B8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brand.amber,
      contrastText: '#0B2430',
    },
    background: {
      default: '#F4F7F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0B2430',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});
