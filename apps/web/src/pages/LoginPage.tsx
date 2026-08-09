import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { keyframes } from '@emotion/react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Fade,
  FormControlLabel,
  InputAdornment,
  Link as MuiLink,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { extractErrorMessage } from '../api/client';
import { AnimatedAuthBackground } from '../components/AnimatedAuthBackground';
import { PasswordField } from '../components/PasswordField';
import { brand } from '../theme/theme';
import testSphereLogo from '../assets/testsphere-logo.jpeg';

interface FormErrors {
  email?: string;
  password?: string;
}

interface LocationState {
  from?: Location;
  demoEmail?: string;
  demoPassword?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = [
  { Icon: DescriptionOutlinedIcon, label: 'Requirements Management' },
  { Icon: ChecklistOutlinedIcon, label: 'Test Case Management' },
  { Icon: BugReportOutlinedIcon, label: 'Defect Tracking' },
  { Icon: PlayCircleOutlineOutlinedIcon, label: 'Test Execution' },
  { Icon: SecurityOutlinedIcon, label: 'Role-Based Access' },
  { Icon: FactCheckOutlinedIcon, label: 'Audit Trail' },
];

const blink = keyframes`
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
`;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performLogin = async (emailValue: string, passwordValue: string) => {
    setIsSubmitting(true);
    try {
      await login(emailValue.trim(), passwordValue, rememberMe);
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Unable to sign in. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Arriving from the Demo Credentials page with a selected role — prefill
    // the form and sign in immediately so picking a role is a single click.
    const state = location.state as LocationState | null;
    if (state?.demoEmail) {
      setEmail(state.demoEmail);
      setPassword(state.demoPassword ?? '');
      void performLogin(state.demoEmail, state.demoPassword ?? '');
    }
    // Intentionally mount-only: this should only apply to the navigation that
    // brought the user here, not re-run on every location.state identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      nextErrors.password = 'Password is required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate() || isSubmitting) {
      return;
    }
    await performLogin(email, password);
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <AnimatedAuthBackground />

      <Box
        component={RouterLink}
        to="/"
        sx={{
          position: 'absolute',
          zIndex: 2,
          top: { xs: 20, sm: 28 },
          left: { xs: 20, sm: 32 },
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.75,
          py: 0.75,
          borderRadius: 999,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '0.85rem',
          color: brand.tealDark,
          bgcolor: 'rgba(255,255,255,0.7)',
          border: `1px solid ${brand.teal}33`,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
        }}
      >
        <HomeOutlinedIcon sx={{ fontSize: 18 }} />
        Home
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: { lg: 'center' },
        }}
      >
        {/* Marketing hero — capped at lg so it hugs its own content instead of
            flex:1 stretching across the whole viewport and stranding the
            sign-in card far to the right with dead space between them. */}
        <Box
          sx={{
            flex: { xs: 1, lg: '0 1 720px' },
            maxWidth: { lg: 720 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: { xs: 2.5, sm: 3 },
            px: { xs: 3, sm: 5, md: 8 },
            py: { xs: 5, md: 6 },
          }}
        >
          <Typography
            sx={{
              fontStyle: 'italic',
              fontWeight: 800,
              fontSize: { xs: '1.9rem', sm: '2.2rem' },
              letterSpacing: 0.5,
            }}
          >
            <Box component="span" sx={{ color: brand.logoNavy }}>
              Test
            </Box>
            <Box component="span" sx={{ color: brand.logoGold, textShadow: '0 1px 3px rgba(10,55,104,0.35)' }}>
              Sphere
            </Box>
          </Typography>

          <Typography
            sx={{
              color: brand.logoNavy,
              fontWeight: 800,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              lineHeight: 1.15,
            }}
          >
            The complete
            <br />
            <Box component="span" sx={{ color: brand.logoGold, textShadow: '0 1px 3px rgba(10,55,104,0.35)' }}>
              test management
            </Box>
            <br />
            &amp; QA platform.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 32 }}>
            <Typography variant="body1" sx={{ color: 'rgba(10,55,104,0.75)' }}>
              Plan. Execute. Trace. Ship with confidence.
            </Typography>
            <Box
              component="span"
              sx={{
                width: 2,
                height: '1.2em',
                bgcolor: brand.logoGold,
                animation: `${blink} 1s step-end infinite`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, maxWidth: 560 }}>
            {FEATURES.map(({ Icon, label }) => (
              <Box
                key={label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'rgba(255,255,255,0.65)',
                  color: brand.logoNavy,
                  border: '1px solid rgba(11,36,48,0.12)',
                  borderRadius: 999,
                  px: 1.75,
                  py: 0.75,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  boxShadow: '0 1px 4px rgba(11,36,48,0.08)',
                }}
              >
                <Icon sx={{ fontSize: 18, color: brand.logoGold, filter: 'drop-shadow(0 1px 1.5px rgba(10,55,104,0.35))' }} />
                {label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Sign-in card */}
        <Box
          sx={{
            flex: { lg: '0 0 460px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 3, sm: 5, md: 4 },
            py: { xs: 4, md: 6 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            <Fade in timeout={550}>
              <Paper
                elevation={6}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  p: { xs: 3, sm: 4 },
                  borderRadius: 3,
                  border: '1px solid rgba(11,36,48,0.06)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                    background: `linear-gradient(90deg, ${brand.teal}, ${brand.amber})`,
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  {/* testsphere-logo.jpeg bakes the wordmark into a 1280x1280 canvas
                      with huge white padding; crop to the glyph's own bounding box
                      so tripling the scale enlarges the logo, not the dead space. */}
                  <Box sx={{ width: 200, height: 41, overflow: 'hidden', position: 'relative' }}>
                    <Box
                      component="img"
                      src={testSphereLogo}
                      alt="TestSphere"
                      sx={{ position: 'absolute', top: -241, left: -153, width: 540, height: 540, maxWidth: 'none' }}
                    />
                  </Box>
                </Box>

                <Typography variant="h6" align="center" sx={{ fontWeight: 700 }} gutterBottom>
                  Welcome back
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
                  Sign in to your TestSphere dashboard
                </Typography>

                <Box component="form" noValidate onSubmit={handleSubmit}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    margin="normal"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                    disabled={isSubmitting}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <PasswordField
                    label="Password"
                    fullWidth
                    margin="normal"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={!!errors.password}
                    helperText={errors.password}
                    disabled={isSubmitting}
                    startAdornment={<LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
                  />

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      mt: 1,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(event) => setRememberMe(event.target.checked)}
                          disabled={isSubmitting}
                        />
                      }
                      label="Remember me"
                    />
                    <MuiLink component={RouterLink} to="/forgot-password" variant="body2" underline="hover">
                      Forgot password?
                    </MuiLink>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={isSubmitting}
                    endIcon={!isSubmitting && <ArrowForwardIcon />}
                    sx={{ mt: 3, py: 1.25 }}
                  >
                    {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                  </Button>

                  <Button
                    component={RouterLink}
                    to="/demo-credentials"
                    variant="outlined"
                    fullWidth
                    disabled={isSubmitting}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      mt: 1.5,
                      py: 1.1,
                      color: '#8a5a00',
                      borderColor: brand.amber,
                      bgcolor: `${brand.amber}14`,
                      '&:hover': { bgcolor: `${brand.amber}22`, borderColor: brand.amber },
                    }}
                  >
                    View Demo Accounts
                  </Button>
                </Box>

                <Typography variant="caption" align="center" color="text.secondary" sx={{ mt: 2.5, display: 'block' }}>
                  <ShieldOutlinedIcon sx={{ fontSize: 14, verticalAlign: 'text-bottom', mr: 0.5 }} />
                  Secured · JWT &amp; RBAC protected
                </Typography>
              </Paper>
            </Fade>
          </Box>
        </Box>
      </Box>

      <Typography
        variant="caption"
        align="center"
        sx={{ position: 'relative', zIndex: 1, display: 'block', color: 'rgba(10,55,104,0.55)', pb: 3 }}
      >
        © {new Date().getFullYear()} QMICS. All rights reserved.
      </Typography>

      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={5000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
