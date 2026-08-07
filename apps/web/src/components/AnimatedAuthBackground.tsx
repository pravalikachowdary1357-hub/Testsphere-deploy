import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import LoopOutlinedIcon from '@mui/icons-material/LoopOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { brand } from '../theme/theme';

// Motion motifs echo the TestSphere/QMICS mark itself: slow-drifting glow
// orbs (the "sphere") and concentric rotating rings (the circular "Q").
const drift1 = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(40px, -50px, 0) scale(1.1); }
`;

const drift2 = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-50px, 40px, 0) scale(1.08); }
`;

const spin = keyframes`
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
`;

const spinReverse = keyframes`
  from { transform: translate(-50%, -50%) rotate(360deg); }
  to { transform: translate(-50%, -50%) rotate(0deg); }
`;

const floatUp = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-16px) rotate(5deg); }
`;

const floatDown = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(14px) rotate(-4deg); }
`;

// A slow light sweep that travels the full width of the page — a second,
// distinct kind of motion (traveling) alongside the drift and float motifs,
// echoing the glint on the QMICS mark's checkmark.
const shimmer = keyframes`
  0% { transform: translate3d(-60%, -10%, 0) rotate(12deg); }
  100% { transform: translate3d(160%, 10%, 0) rotate(12deg); }
`;

const reduceMotion = {
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
};

// Faint software-testing glyphs (bug, terminal, coverage, retest loop, sign-off,
// security) drifting in the background — the QA/STLC equivalent of a lab-themed
// page floating flasks and molecules.
const FLOATING_ICONS = [
  { Icon: BugReportOutlinedIcon, top: '13%', left: '42%', size: 46, duration: '10s', delay: '0s', variant: floatUp },
  { Icon: TerminalOutlinedIcon, top: '68%', left: '37%', size: 52, duration: '13s', delay: '1s', variant: floatDown },
  { Icon: GppGoodOutlinedIcon, top: '24%', left: '87%', size: 44, duration: '11s', delay: '2s', variant: floatUp },
  { Icon: InsightsOutlinedIcon, top: '77%', left: '81%', size: 50, duration: '14s', delay: '0.5s', variant: floatDown },
  { Icon: LoopOutlinedIcon, top: '50%', left: '9%', size: 42, duration: '12s', delay: '1.5s', variant: floatUp },
  { Icon: FactCheckOutlinedIcon, top: '8%', left: '67%', size: 40, duration: '15s', delay: '2.5s', variant: floatDown },
] as const;

export function AnimatedAuthBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${brand.skyLight} 0%, ${brand.sky} 55%, ${brand.skyDeep} 100%)`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          left: 0,
          width: '30%',
          height: '140%',
          background: `linear-gradient(100deg, transparent 0%, rgba(245,166,35,0.4) 50%, transparent 100%)`,
          filter: 'blur(20px)',
          animation: `${shimmer} 11s ease-in-out infinite`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '8%',
          left: '6%',
          width: { xs: 260, md: 440 },
          height: { xs: 260, md: 440 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${brand.teal}22 0%, transparent 70%)`,
          animation: `${drift1} 20s ease-in-out infinite`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '6%',
          right: '8%',
          width: { xs: 280, md: 500 },
          height: { xs: 280, md: 500 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${brand.amber}26 0%, transparent 70%)`,
          animation: `${drift2} 24s ease-in-out infinite`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: { xs: 640, md: 960 },
          height: { xs: 640, md: 960 },
          borderRadius: '50%',
          border: `1px solid ${brand.teal}33`,
          animation: `${spin} 100s linear infinite`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: { xs: 440, md: 680 },
          height: { xs: 440, md: 680 },
          borderRadius: '50%',
          border: `1px dashed ${brand.amberDark}30`,
          animation: `${spinReverse} 80s linear infinite`,
          ...reduceMotion,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${brand.teal}2e 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          opacity: 0.5,
        }}
      />

      {FLOATING_ICONS.map(({ Icon, top, left, size, duration, delay, variant }, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            top,
            left,
            display: { xs: 'none', md: 'block' },
            color: index % 2 === 0 ? `${brand.tealDark}2e` : `${brand.amberDark}38`,
            animation: `${variant} ${duration} ease-in-out ${delay} infinite`,
            ...reduceMotion,
          }}
        >
          <Icon sx={{ fontSize: size }} />
        </Box>
      ))}
    </Box>
  );
}
