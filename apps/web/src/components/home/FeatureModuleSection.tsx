import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import type SvgIcon from '@mui/material/SvgIcon';
import { brand } from '../../theme/theme';
import { SectionBackground } from './SectionBackground';

interface FeatureModuleSectionProps {
  id: string;
  Icon: typeof SvgIcon;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: ReactNode;
  reverse?: boolean;
  background?: string;
  seed?: number;
}

export function FeatureModuleSection({
  id,
  Icon,
  eyebrow,
  title,
  description,
  bullets,
  visual,
  reverse = false,
  background = '#fff',
  seed = 0,
}: FeatureModuleSectionProps) {
  return (
    <Box component="section" id={id} sx={{ position: 'relative', overflow: 'hidden', bgcolor: background, py: { xs: 7, md: 10 } }}>
      <SectionBackground variant="light" seed={seed} />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1240,
          mx: 'auto',
          px: { xs: 3, sm: 5, md: 6 },
          display: 'flex',
          flexDirection: { xs: 'column', md: reverse ? 'row-reverse' : 'row' },
          alignItems: 'center',
          gap: { xs: 5, md: 8 },
        }}
      >
        <Box sx={{ flex: '1 1 480px', maxWidth: 560 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: `${brand.teal}16`,
              color: brand.teal,
              mb: 2,
            }}
          >
            <Icon sx={{ fontSize: 22 }} />
          </Box>
          <Typography variant="overline" sx={{ color: brand.teal, fontWeight: 700, letterSpacing: 1.2, display: 'block' }}>
            {eyebrow}
          </Typography>
          <Typography sx={{ color: brand.tealDark, fontWeight: 800, fontSize: { xs: '1.6rem', md: '1.9rem' }, mt: 0.5, mb: 1.75 }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
            {description}
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {bullets.map((bullet) => (
              <Box component="li" key={bullet} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                <CheckCircleOutlinedIcon sx={{ fontSize: 19, color: brand.teal, mt: 0.2, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: 'rgba(11,36,48,0.8)' }}>
                  {bullet}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ flex: '1 1 420px', width: '100%', maxWidth: 460, display: 'flex', justifyContent: 'center' }}>
          {visual}
        </Box>
      </Box>
    </Box>
  );
}
