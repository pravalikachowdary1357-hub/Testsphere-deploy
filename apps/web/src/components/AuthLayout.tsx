import type { ReactNode } from 'react';
import { Box, Fade, Paper, Typography } from '@mui/material';
import { AnimatedAuthBackground } from './AnimatedAuthBackground';
import qmicsLogo from '../assets/qmics-logo.png';
import testSphereLogo from '../assets/testsphere-logo.jpeg';

interface AuthLayoutProps {
  children: ReactNode;
  maxWidth?: number;
}

export function AuthLayout({ children, maxWidth = 420 }: AuthLayoutProps) {
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AnimatedAuthBackground />

      <Box
        component="img"
        src={qmicsLogo}
        alt="QMICS"
        sx={{
          position: 'relative',
          zIndex: 1,
          alignSelf: 'flex-start',
          height: { xs: 56, sm: 72, md: 88 },
          m: { xs: 3, sm: 4 },
          filter: 'drop-shadow(0 3px 10px rgba(11,36,48,0.18))',
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          pt: { xs: 3, sm: 4 },
          pb: { xs: 4, sm: 5 },
        }}
      >
        <Fade in timeout={550}>
          <Paper
            elevation={6}
            sx={{
              width: '100%',
              maxWidth,
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.98)',
              border: '1px solid rgba(11,36,48,0.06)',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
              <Box
                component="img"
                src={testSphereLogo}
                alt="TestSphere"
                sx={{ width: { xs: 240, sm: 300, md: 340 }, maxWidth: '100%' }}
              />
              <Typography variant="subtitle2" color="text.secondary" sx={{ letterSpacing: 0.3, textAlign: 'center' }}>
                Trusted QMICS SaaS platform for software test management and quality assurance.
              </Typography>
            </Box>

            {children}
          </Paper>
        </Fade>
      </Box>

      <Typography
        variant="caption"
        align="center"
        sx={{ position: 'relative', zIndex: 1, color: 'rgba(11,36,48,0.55)', pb: 2 }}
      >
        © {new Date().getFullYear()} QMICS. All rights reserved.
      </Typography>
    </Box>
  );
}
