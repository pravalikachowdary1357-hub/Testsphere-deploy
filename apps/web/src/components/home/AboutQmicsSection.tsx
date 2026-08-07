import { Box, Button, Typography } from '@mui/material';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import { brand } from '../../theme/theme';
import { SectionBackground } from './SectionBackground';
import qmicsLogo from '../../assets/qmics-logo.png';

export function AboutQmicsSection() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${brand.tealDark} 0%, ${brand.tealDarker} 100%)`,
        py: { xs: 8, md: 11 },
      }}
    >
      <SectionBackground variant="dark" seed={1} />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 780, mx: 'auto', px: { xs: 3, sm: 5, md: 6 }, textAlign: 'center' }}>
        <Box
          component="img"
          src={qmicsLogo}
          alt="QMICS"
          sx={{ height: { xs: 56, md: 72 }, mb: 3.5, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}
        />
        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '1.7rem', md: '2.1rem' }, mb: 1 }}>
          About QMICS Solutions
        </Typography>
        <Typography sx={{ color: brand.amberLight, fontWeight: 700, fontSize: { xs: '1rem', md: '1.15rem' }, mb: 2.5, letterSpacing: 0.3 }}>
          Driving Quality Through Innovation
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, mb: 4 }}>
          QMICS Solutions is a technology-driven company specializing in Quality Management,
          Compliance, Laboratory, Audit, Learning, and Enterprise Management solutions. We
          develop intelligent software platforms that help organizations simplify operations,
          improve compliance, enhance productivity, and accelerate digital transformation
          across industries. Our integrated ecosystem combines modern technologies,
          automation, and AI to deliver reliable, scalable, and user-friendly business
          solutions.
        </Typography>
        <Button
          component="a"
          href="https://qmicssolutions.com/"
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          endIcon={<LaunchOutlinedIcon sx={{ fontSize: 16 }} />}
          sx={{
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.4)',
            px: 3,
            py: 1.1,
            '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
          }}
        >
          Visit qmicssolutions.com
        </Button>
      </Box>
    </Box>
  );
}
