import { Box, Typography } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { brand } from '../../theme/theme';
import { TestSphereLogoMark } from '../TestSphereLogoMark';
import { SectionBackground } from './SectionBackground';

const OFFICE_ADDRESS = [
  'V Starx IT Hub, Plot No:55,',
  '4th Floor,',
  '15th Phase, Green Hills Road,',
  'KPHB Colony, Kukatpally,',
  'Hyderabad - 500072',
];

const PRODUCT_LINKS = [
  { href: '#product-tour', label: 'Product Tour' },
  { href: '#modules', label: 'Modules' },
  { href: '#roles', label: 'User Roles' },
  { href: '#why-testsphere', label: 'Why TestSphere' },
];

function FooterHeading({ children }: { children: string }) {
  return (
    <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.8, color: 'rgba(255,255,255,0.5)', display: 'block', mb: 1.5 }}>
      {children.toUpperCase()}
    </Typography>
  );
}

export function HomeFooter() {
  return (
    <Box component="footer" sx={{ position: 'relative', overflow: 'hidden', bgcolor: brand.tealDarker, pt: { xs: 6, md: 8 }, pb: 4 }}>
      <SectionBackground variant="dark" seed={0} />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1240,
          mx: 'auto',
          px: { xs: 3, sm: 5, md: 6 },
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 5, md: 4 },
          justifyContent: 'space-between',
          pb: 5,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Box sx={{ flex: '1 1 260px', maxWidth: 320 }}>
          <Box sx={{ mb: 2 }}>
            <TestSphereLogoMark height={30} onDark />
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            The QMICS platform for end-to-end test management — requirements, cases,
            execution, and defects, connected by one traceability chain.
          </Typography>
        </Box>

        <Box sx={{ flex: '0 1 160px' }}>
          <FooterHeading>Product</FooterHeading>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {PRODUCT_LINKS.map((link) => (
              <Typography
                key={link.href}
                component="a"
                href={link.href}
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', '&:hover': { color: '#fff' } }}
              >
                {link.label}
              </Typography>
            ))}
          </Box>
        </Box>

        <Box sx={{ flex: '0 1 160px' }}>
          <FooterHeading>Account</FooterHeading>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography
              component={RouterLink}
              to="/login"
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', '&:hover': { color: '#fff' } }}
            >
              Sign In
            </Typography>
            <Typography
              component={RouterLink}
              to="/forgot-password"
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', '&:hover': { color: '#fff' } }}
            >
              Forgot Password
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: '1 1 220px', maxWidth: 260 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: `${brand.teal}22`,
                color: brand.amberLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LocationOnOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <FooterHeading>Location</FooterHeading>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
            {OFFICE_ADDRESS.map((line) => (
              <Box key={line} component="span" sx={{ display: 'block' }}>
                {line}
              </Box>
            ))}
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="caption"
        align="center"
        sx={{ position: 'relative', zIndex: 1, display: 'block', mt: 3, color: 'rgba(255,255,255,0.45)' }}
      >
        © {new Date().getFullYear()} QMICS. All rights reserved.
      </Typography>
    </Box>
  );
}
