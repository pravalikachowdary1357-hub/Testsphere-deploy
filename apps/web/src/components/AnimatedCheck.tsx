import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';
import { brand } from '../theme/theme';

// Draws itself like a test assertion resolving to "pass": the outer ring
// completes first, then the check strokes in — the same visual language
// TestSphere uses for a passing test result, reused here for auth success states.
const drawCircle = keyframes`
  from { stroke-dashoffset: 166; }
  to { stroke-dashoffset: 0; }
`;

const drawCheck = keyframes`
  from { stroke-dashoffset: 48; }
  to { stroke-dashoffset: 0; }
`;

const pop = keyframes`
  0% { transform: scale(0.75); opacity: 0; }
  60% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const reduceMotion = {
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

interface AnimatedCheckProps {
  size?: number;
}

export function AnimatedCheck({ size = 72 }: AnimatedCheckProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mb: 1,
        animation: `${pop} 0.35s ease-out`,
        ...reduceMotion,
      }}
    >
      <Box component="svg" width={size} height={size} viewBox="0 0 52 52" sx={{ display: 'block' }}>
        <Box
          component="circle"
          cx={26}
          cy={26}
          r={24}
          sx={{
            fill: 'none',
            stroke: brand.teal,
            strokeWidth: 3,
            strokeDasharray: 166,
            strokeDashoffset: 166,
            animation: `${drawCircle} 0.6s ease-out 0.1s forwards`,
            ...reduceMotion,
          }}
        />
        <Box
          component="path"
          d="M15 27l7 7 15-15"
          sx={{
            fill: 'none',
            stroke: brand.teal,
            strokeWidth: 3.5,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeDasharray: 48,
            strokeDashoffset: 48,
            animation: `${drawCheck} 0.4s ease-out 0.65s forwards`,
            ...reduceMotion,
          }}
        />
      </Box>
    </Box>
  );
}
