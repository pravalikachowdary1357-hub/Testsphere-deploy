import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import LoopOutlinedIcon from '@mui/icons-material/LoopOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { brand } from '../../theme/theme';

// The same drifting-orb / dot-grid / floating-QA-icon motifs as the login
// page's AnimatedAuthBackground, resized to sit behind one section instead
// of the whole viewport, so the animated feel is consistent end to end.
const drift1 = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(26px, -34px, 0) scale(1.08); }
`;
const drift2 = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-30px, 26px, 0) scale(1.06); }
`;
const floatUp = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(4deg); }
`;
const floatDown = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(11px) rotate(-3deg); }
`;
// A slow light sweep that travels the full width of the section — a second,
// distinct kind of motion (traveling) alongside the drift (in-place) and
// float (bobbing) motifs, echoing the glint on the QMICS mark's checkmark.
const shimmer = keyframes`
  0% { transform: translate3d(-60%, -10%, 0) rotate(12deg); }
  100% { transform: translate3d(160%, 10%, 0) rotate(12deg); }
`;
const reduceMotion = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

const ICON_POOL = [
  BugReportOutlinedIcon,
  TerminalOutlinedIcon,
  GppGoodOutlinedIcon,
  InsightsOutlinedIcon,
  LoopOutlinedIcon,
  FactCheckOutlinedIcon,
];

// Four deterministic layout presets so consecutive sections don't repeat the
// exact same icon placement while scrolling — picked by `seed`, not random.
const LAYOUTS = [
  { orb1: { top: '-8%', left: '-6%' }, orb2: { bottom: '-10%', right: '-6%' }, icons: [{ top: '18%', left: '90%', size: 36 }, { top: '78%', left: '8%', size: 32 }] },
  { orb1: { top: '-10%', right: '-8%' }, orb2: { bottom: '-12%', left: '-8%' }, icons: [{ top: '15%', left: '6%', size: 34 }, { top: '75%', left: '92%', size: 38 }] },
  { orb1: { bottom: '-14%', right: '-4%' }, orb2: { top: '-6%', left: '-4%' }, icons: [{ top: '25%', left: '85%', size: 30 }, { top: '65%', left: '4%', size: 36 }] },
  { orb1: { top: '-6%', left: '40%' }, orb2: { bottom: '-16%', right: '20%' }, icons: [{ top: '20%', left: '10%', size: 32 }, { top: '70%', left: '88%', size: 34 }] },
] as const;

interface SectionBackgroundProps {
  variant?: 'light' | 'dark';
  seed?: number;
}

export function SectionBackground({ variant = 'light', seed = 0 }: SectionBackgroundProps) {
  const layout = LAYOUTS[seed % LAYOUTS.length];
  const [IconA, IconB] = [ICON_POOL[seed % ICON_POOL.length], ICON_POOL[(seed + 3) % ICON_POOL.length]];

  const dotColor = variant === 'dark' ? 'rgba(255,255,255,0.09)' : `${brand.teal}22`;
  const orbColorA = variant === 'dark' ? `${brand.teal}33` : `${brand.teal}18`;
  const orbColorB = variant === 'dark' ? 'rgba(255,255,255,0.06)' : `${brand.amber}1c`;
  const iconColorA = variant === 'dark' ? 'rgba(255,255,255,0.08)' : `${brand.tealDark}22`;
  const iconColorB = variant === 'dark' ? `${brand.amberLight}2a` : `${brand.amberDark}2e`;
  const shimmerColor = variant === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(245,166,35,0.4)';

  return (
    <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          opacity: 0.6,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          left: 0,
          width: '35%',
          height: '140%',
          background: `linear-gradient(100deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
          filter: 'blur(18px)',
          animation: `${shimmer} ${10 + seed}s ease-in-out infinite`,
          animationDelay: `${seed * 1.5}s`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          ...layout.orb1,
          width: { xs: 220, md: 360 },
          height: { xs: 220, md: 360 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orbColorA} 0%, transparent 70%)`,
          animation: `${drift1} 22s ease-in-out infinite`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          ...layout.orb2,
          width: { xs: 200, md: 320 },
          height: { xs: 200, md: 320 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orbColorB} 0%, transparent 70%)`,
          animation: `${drift2} 26s ease-in-out infinite`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: layout.icons[0].top,
          left: layout.icons[0].left,
          display: { xs: 'none', md: 'block' },
          color: iconColorA,
          animation: `${floatUp} 12s ease-in-out infinite`,
          ...reduceMotion,
        }}
      >
        <IconA sx={{ fontSize: layout.icons[0].size }} />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          top: layout.icons[1].top,
          left: layout.icons[1].left,
          display: { xs: 'none', md: 'block' },
          color: iconColorB,
          animation: `${floatDown} 14s ease-in-out infinite`,
          ...reduceMotion,
        }}
      >
        <IconB sx={{ fontSize: layout.icons[1].size }} />
      </Box>
    </Box>
  );
}
