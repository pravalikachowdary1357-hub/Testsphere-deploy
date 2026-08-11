import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';
import { brand } from '../theme/theme';

// Same visual language as the homepage hero / login page background
// (AnimatedAuthBackground, SectionBackground) — a sky-teal gradient, a dot
// grid, drifting glow orbs, and a slow light sweep — scaled down to fit a
// narrow, tall nav column instead of a full viewport.
const drift1 = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(14px, -18px, 0) scale(1.08); }
`;
const drift2 = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-12px, 16px, 0) scale(1.06); }
`;
const shimmer = keyframes`
  0% { transform: translate3d(-40%, -70%, 0) rotate(12deg); }
  100% { transform: translate3d(40%, 170%, 0) rotate(12deg); }
`;
const reduceMotion = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

export function SidebarBackground() {
  return (
    <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(190deg, ${brand.skyLight} 0%, ${brand.sky} 55%, ${brand.skyDeep} 100%)`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${brand.teal}22 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
          opacity: 0.5,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '-30%',
          left: 0,
          width: '220%',
          height: '26%',
          background: `linear-gradient(100deg, transparent 0%, rgba(245,166,35,0.35) 50%, transparent 100%)`,
          filter: 'blur(16px)',
          animation: `${shimmer} 13s ease-in-out infinite`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '-8%',
          left: '-30%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${brand.teal}28 0%, transparent 70%)`,
          animation: `${drift1} 20s ease-in-out infinite`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '4%',
          right: '-35%',
          width: 190,
          height: 190,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${brand.amber}28 0%, transparent 70%)`,
          animation: `${drift2} 24s ease-in-out infinite`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '48%',
          left: '52%',
          width: 260,
          height: 260,
          borderRadius: '50%',
          border: `1px solid ${brand.teal}26`,
        }}
      />
    </Box>
  );
}
