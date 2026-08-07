import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Link as MuiLink,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { apiClient, extractErrorMessage } from '../api/client';
import { AuthLayout } from '../components/AuthLayout';
import { AnimatedCheck } from '../components/AnimatedCheck';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForgotPasswordResponse {
  message: string;
  devResetToken?: string;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError('Enter a valid email address');
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
        email: email.trim(),
      });
      setDevResetToken(data.devResetToken ?? null);
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Unable to send reset instructions right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {submitted ? (
        <Box sx={{ textAlign: 'center' }}>
          <AnimatedCheck />
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
            Check your email
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            If an account exists for <strong>{email.trim()}</strong>, we've sent instructions to
            reset the password. The link expires in 1 hour.
          </Typography>

          {devResetToken && (
            <Alert severity="info" variant="outlined" sx={{ textAlign: 'left', mb: 3 }}>
              <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                Dev mode only — no email service is configured yet, so here's a direct link:
              </Typography>
              <MuiLink
                component={RouterLink}
                to={`/reset-password?token=${devResetToken}`}
                variant="body2"
                underline="hover"
                sx={{ wordBreak: 'break-all' }}
              >
                Open reset link
              </MuiLink>
            </Alert>
          )}

          <Button component={RouterLink} to="/login" variant="contained" fullWidth>
            Back to sign in
          </Button>
        </Box>
      ) : (
        <>
          <Typography variant="h6" align="center" sx={{ fontWeight: 700 }} gutterBottom>
            Forgot your password?
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Enter your account email and we'll send you a link to reset it.
          </Typography>

          <Box component="form" noValidate onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={!!emailError}
              helperText={emailError}
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

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{ mt: 3, py: 1.25 }}
            >
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Send reset link'}
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 3 }}>
              <MuiLink component={RouterLink} to="/login" underline="hover">
                Back to sign in
              </MuiLink>
            </Typography>
          </Box>
        </>
      )}

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
    </AuthLayout>
  );
}
