import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppShell } from '../components/AppShell';
import { AnimatedCheck } from '../components/AnimatedCheck';
import { PasswordField } from '../components/PasswordField';

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const SIGN_OUT_DELAY_MS = 2200;

export function ChangePasswordPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
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
    const timer = setTimeout(() => {
      logout();
      navigate('/login', { replace: true });
    }, SIGN_OUT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [succeeded, logout, navigate]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!currentPassword) {
      nextErrors.currentPassword = 'Current password is required';
    }
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
    if (!validate() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      setSucceeded(true);
    } catch (error) {
      setApiError(extractErrorMessage(error, 'Unable to change your password right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Change Password">
      <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 }, maxWidth: 480, borderRadius: 3 }}>
        {succeeded ? (
          <Box sx={{ textAlign: 'center' }}>
            <AnimatedCheck />
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Password changed
            </Typography>
            <Typography variant="body2" color="text.secondary">
              For your security, we're signing you out of all sessions&hellip;
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose a strong password you don't use anywhere else. You'll be signed out
              everywhere afterwards and need to sign in again.
            </Typography>

            {apiError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {apiError}
              </Alert>
            )}

            <Box component="form" noValidate onSubmit={handleSubmit}>
              <PasswordField
                label="Current password"
                fullWidth
                margin="normal"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                error={!!errors.currentPassword}
                helperText={errors.currentPassword}
                disabled={isSubmitting}
                startAdornment={<LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
              />
              <PasswordField
                label="New password"
                fullWidth
                margin="normal"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
                disabled={isSubmitting}
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
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                sx={{ mt: 3, py: 1.25 }}
              >
                {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Change password'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </AppShell>
  );
}
