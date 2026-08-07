import { Box, Button, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink } from 'react-router-dom';
import { brand } from '../../theme/theme';
import { SectionBackground } from './SectionBackground';

export function CallToActionSection() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${brand.teal} 0%, ${brand.tealDark} 100%)`,
        py: { xs: 8, md: 10 },
      }}
    >
      <SectionBackground variant="dark" seed={3} />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 720,
          mx: 'auto',
          px: { xs: 3, sm: 5 },
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.3rem' }, mb: 2 }}>
          Ready to see it end to end?
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 4 }}>
          Sign in with the live demo account and walk the authentication flow yourself —
          credentials are pre-filled for you on the sign-in page.
        </Typography>
        <Button
          component={RouterLink}
          to="/login"
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          sx={{
            px: 4,
            py: 1.4,
            bgcolor: '#fff',
            color: brand.tealDark,
            '&:hover': { bgcolor: brand.skyLight },
          }}
        >
          Sign In
        </Button>
      </Box>
    </Box>
  );
}
