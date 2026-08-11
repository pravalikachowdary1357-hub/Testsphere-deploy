import { useState } from 'react';
import { Box, Button, Slide, Typography, useScrollTrigger } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink } from 'react-router-dom';
import { brand } from '../../theme/theme';
import { TestSphereLogoMark } from '../TestSphereLogoMark';

const NAV_LINKS = [
  { href: '#product-tour', label: 'How It Works' },
  { href: '#modules', label: 'Features' },
  { href: '#roles', label: 'User Roles' },
  { href: '#why-testsphere', label: 'Why Choose Us' },
];

function Wordmark() {
  return (
    <Box component="a" href="#top" sx={{ display: 'inline-flex', lineHeight: 0 }}>
      <TestSphereLogoMark height={38} />
    </Box>
  );
}

export function HomeNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });

  return (
    <Slide appear={false} direction="down" in>
      <Box
        component="nav"
        id="top"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          transition: 'background-color 200ms ease, box-shadow 200ms ease',
          backgroundColor: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(10px)',
          boxShadow: scrolled ? '0 2px 16px rgba(11,36,48,0.08)' : 'none',
          borderBottom: '1px solid rgba(11,36,48,0.06)',
        }}
      >
        <Box
          sx={{
            maxWidth: 1240,
            mx: 'auto',
            px: { xs: 3, sm: 5, md: 6 },
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Wordmark />

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3.5 }}>
            {NAV_LINKS.map((link) => (
              <Typography
                key={link.href}
                component="a"
                href={link.href}
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'rgba(11,36,48,0.75)',
                  textDecoration: 'none',
                  '&:hover': { color: brand.teal },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{ px: 2.5 }}
            >
              Sign In
            </Button>
          </Box>

          <Box
            component="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
            sx={{
              display: { xs: 'flex', sm: 'none' },
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              border: 'none',
              borderRadius: '50%',
              bgcolor: 'transparent',
              color: brand.tealDark,
              cursor: 'pointer',
            }}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </Box>
        </Box>

        {menuOpen && (
          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              flexDirection: 'column',
              gap: 0.5,
              px: 3,
              pb: 2.5,
            }}
          >
            {NAV_LINKS.map((link) => (
              <Typography
                key={link.href}
                component="a"
                href={link.href}
                onClick={() => setMenuOpen(false)}
                sx={{
                  py: 1,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: brand.tealDark,
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Typography>
            ))}
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              fullWidth
              sx={{ mt: 1 }}
            >
              Sign In
            </Button>
          </Box>
        )}
      </Box>
    </Slide>
  );
}
