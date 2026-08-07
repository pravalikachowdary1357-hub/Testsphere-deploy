import { keyframes } from '@emotion/react';
import { Box, Button, Chip, Fade, Paper, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import PlayCircleFilledOutlinedIcon from '@mui/icons-material/PlayCircleFilledOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import LoopOutlinedIcon from '@mui/icons-material/LoopOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { brand } from '../../theme/theme';

const drift1 = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(30px, -40px, 0) scale(1.08); }
`;
const drift2 = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-40px, 30px, 0) scale(1.06); }
`;
const floatUp = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-14px) rotate(4deg); }
`;
const floatDown = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(12px) rotate(-3deg); }
`;
// A slow light sweep that travels the full width of the hero — a second,
// distinct kind of motion (traveling) alongside drift and float.
const shimmer = keyframes`
  0% { transform: translate3d(-60%, -10%, 0) rotate(12deg); }
  100% { transform: translate3d(160%, 10%, 0) rotate(12deg); }
`;
const reduceMotion = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } };

const FLOATING_ICONS = [
  { Icon: BugReportOutlinedIcon, top: '14%', left: '6%', size: 34, duration: '11s', variant: floatUp },
  { Icon: TerminalOutlinedIcon, top: '72%', left: '10%', size: 38, duration: '13s', variant: floatDown },
  { Icon: GppGoodOutlinedIcon, top: '20%', left: '92%', size: 32, duration: '12s', variant: floatUp },
  { Icon: InsightsOutlinedIcon, top: '80%', left: '88%', size: 36, duration: '14s', variant: floatDown },
  { Icon: LoopOutlinedIcon, top: '46%', left: '96%', size: 30, duration: '15s', variant: floatUp },
] as const;

const TRUST_BADGES = [
  { Icon: ShieldOutlinedIcon, label: 'JWT + RBAC secured' },
  { Icon: FactCheckOutlinedIcon, label: 'Full audit trail' },
  { Icon: MapOutlinedIcon, label: 'Public build roadmap' },
];

const CHAIN_PREVIEW = [
  { Icon: DescriptionOutlinedIcon, label: 'Requirement raised' },
  { Icon: ChecklistOutlinedIcon, label: 'Test case written' },
  { Icon: PlayCircleFilledOutlinedIcon, label: 'Execution run' },
  { Icon: BugReportOutlinedIcon, label: 'Defect logged' },
  { Icon: RocketLaunchOutlinedIcon, label: 'Release scored', done: true },
];

export function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${brand.skyLight} 0%, ${brand.sky} 55%, ${brand.skyDeep} 100%)`,
      }}
    >
      {/* Decorative motion layer, contained to the hero (not viewport-fixed) so it scrolls away naturally */}
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: '-20%',
            left: 0,
            width: '30%',
            height: '140%',
            background: 'linear-gradient(100deg, transparent 0%, rgba(245,166,35,0.4) 50%, transparent 100%)',
            filter: 'blur(20px)',
            animation: `${shimmer} 11s ease-in-out infinite`,
            ...reduceMotion,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            left: '-6%',
            width: { xs: 280, md: 460 },
            height: { xs: 280, md: 460 },
            borderRadius: '50%',
            background: `radial-gradient(circle, ${brand.teal}22 0%, transparent 70%)`,
            animation: `${drift1} 20s ease-in-out infinite`,
            ...reduceMotion,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-14%',
            right: '-6%',
            width: { xs: 300, md: 520 },
            height: { xs: 300, md: 520 },
            borderRadius: '50%',
            background: `radial-gradient(circle, ${brand.amber}26 0%, transparent 70%)`,
            animation: `${drift2} 24s ease-in-out infinite`,
            ...reduceMotion,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(${brand.teal}22 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
            opacity: 0.5,
          }}
        />
        {FLOATING_ICONS.map(({ Icon, top, left, size, duration, variant }, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top,
              left,
              display: { xs: 'none', md: 'block' },
              color: index % 2 === 0 ? `${brand.tealDark}2e` : `${brand.amberDark}38`,
              animation: `${variant} ${duration} ease-in-out infinite`,
              ...reduceMotion,
            }}
          >
            <Icon sx={{ fontSize: size }} />
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1240,
          mx: 'auto',
          px: { xs: 3, sm: 5, md: 6 },
          py: { xs: 8, md: 11 },
          display: 'flex',
          alignItems: 'center',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: { xs: 6, lg: 8 },
        }}
      >
        <Box sx={{ flex: '1 1 560px', maxWidth: 620 }}>
          <Chip
            label="QMICS · Test Management &amp; QA Platform"
            size="small"
            sx={{
              mb: 2.5,
              fontWeight: 700,
              color: brand.tealDark,
              bgcolor: 'rgba(255,255,255,0.7)',
              border: `1px solid ${brand.teal}33`,
            }}
          />

          <Typography
            sx={{
              color: brand.tealDark,
              fontWeight: 800,
              fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.4rem' },
              lineHeight: 1.12,
              mb: 2.5,
            }}
          >
            One platform for the
            <br />
            <Box component="span" sx={{ color: brand.amberDark }}>
              entire test lifecycle.
            </Box>
          </Typography>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              color: 'rgba(11,36,48,0.75)',
              mb: 4,
              maxWidth: 520,
              fontSize: { xs: '1rem', sm: '1.15rem' },
            }}
          >
            Requirements, test cases, executions, defects, and release sign-off — connected end
            to end, so quality status is a query, not a spreadsheet.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ px: 3.5, py: 1.25 }}
            >
              Sign In
            </Button>
            <Button
              component="a"
              href="#product-tour"
              variant="outlined"
              size="large"
              startIcon={<PlayCircleOutlineOutlinedIcon />}
              sx={{ px: 3, py: 1.25, borderColor: brand.teal, color: brand.tealDark }}
            >
              See how it works
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, sm: 3 } }}>
            {TRUST_BADGES.map(({ Icon, label }) => (
              <Box
                key={label}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'rgba(11,36,48,0.65)' }}
              >
                <Icon sx={{ fontSize: 18, color: brand.teal }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ flex: '1 1 420px', width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'center' }}>
          <Fade in timeout={650}>
            <Paper
              elevation={8}
              sx={{
                width: '100%',
                p: { xs: 3, sm: 3.5 },
                borderRadius: 4,
                border: '1px solid rgba(11,36,48,0.06)',
              }}
            >
              <Typography variant="overline" sx={{ color: brand.teal, fontWeight: 700, letterSpacing: 1 }}>
                The traceability chain
              </Typography>
              <Box sx={{ mt: 2, position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 15,
                    top: 16,
                    bottom: 16,
                    width: 2,
                    bgcolor: 'rgba(11,36,48,0.1)',
                  }}
                />
                {CHAIN_PREVIEW.map(({ Icon, label, done }) => (
                  <Box
                    key={label}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.75,
                      py: 1.1,
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: done ? brand.teal : '#fff',
                        border: `2px solid ${done ? brand.teal : brand.amber}`,
                        color: done ? '#fff' : brand.amberDark,
                      }}
                    >
                      <Icon sx={{ fontSize: 17 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: brand.tealDark }}>
                      {label}
                    </Typography>
                    {done && (
                      <Chip
                        label="Ready"
                        size="small"
                        sx={{
                          ml: 'auto',
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor: `${brand.teal}18`,
                          color: brand.teal,
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
}
