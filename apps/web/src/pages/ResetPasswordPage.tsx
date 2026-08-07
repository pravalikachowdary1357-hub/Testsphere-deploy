import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, Link as MuiLink, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient, extractErrorMessage } from '../api/client';
import { AuthLayout } from '../components/AuthLayout';
import { AnimatedCheck } from '../components/AnimatedCheck';
import { PasswordField } from '../components/PasswordField';

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

const REDIRECT_DELAY_MS = 2500;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  useEffect(() => {
    if (!succeeded) {
      return;
    }
    const timer = setTimeout(() => navigate('/login', { replace: true }), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [succeeded, navigate]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (newPassword.length < 8) {
      nextErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !validate() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword });
      setSucceeded(true);
    } catch (error) {
      setApiError(extractErrorMessage(error, 'Unable to reset your password right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {!token ? (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
            This reset link is invalid
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The link is missing its reset token. Request a new one to continue.
          </Typography>
          <Button component={RouterLink} to="/forgot-password" variant="contained" fullWidth>
            Request a new link
          </Button>
        </Box>
      ) : succeeded ? (
        <Box sx={{ textAlign: 'center' }}>
          <AnimatedCheck />
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
            Password reset
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Redirecting you to sign in with your new password&hellip;
          </Typography>
          <Button component={RouterLink} to="/login" variant="contained" fullWidth>
            Continue to sign in
          </Button>
        </Box>
      ) : (
        <>
          <Typography variant="h6" align="center" sx={{ fontWeight: 700 }} gutterBottom>
            Choose a new password
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Make it at least 8 characters. You'll need to sign in again afterwards.
          </Typography>

          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}{' '}
              <MuiLink component={RouterLink} to="/forgot-password" underline="hover">
                Request a new link
              </MuiLink>
            </Alert>
          )}

          <Box component="form" noValidate onSubmit={handleSubmit}>
            <PasswordField
              label="New password"
              fullWidth
              margin="normal"
              autoComplete="new-password"
              autoFocus
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              error={!!errors.newPassword}
              helperText={errors.newPassword}
              disabled={isSubmitting}
              startAdornment={<LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
            />
            <PasswordField
              label="Confirm new password"
              fullWidth
              margin="normal"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={isSubmitting}
              startAdornment={<LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{ mt: 3, py: 1.25 }}
            >
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Reset password'}
            </Button>
          </Box>
        </>
      )}
    </AuthLayout>
  );
}
