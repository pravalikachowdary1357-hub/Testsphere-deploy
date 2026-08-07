import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Fade,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useNavigate } from 'react-router-dom';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { AuthUser } from '../auth/types';
import { AppShell } from '../components/AppShell';

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [nameError, setNameError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  if (!user) {
    return null;
  }

  const isUnchanged = fullName.trim() === user.fullName;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!fullName.trim()) {
      setNameError('Full name is required');
      return;
    }
    setNameError(undefined);
    if (isUnchanged || isSaving) {
      return;
    }

    setIsSaving(true);
    setApiError(null);
    try {
      const { data } = await apiClient.patch<AuthUser>('/users/me', { fullName: fullName.trim() });
      updateUser(data);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (error) {
      setApiError(extractErrorMessage(error, 'Unable to save your profile right now.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="My Profile">
      <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 }, maxWidth: 640, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 64, height: 64, fontSize: 24, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
            {getInitials(user.fullName)}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {user.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <Box component="form" noValidate onSubmit={handleSubmit}>
          <TextField
            label="Full name"
            fullWidth
            margin="normal"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            error={!!nameError}
            helperText={nameError}
            disabled={isSaving}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={user.email}
            disabled
            helperText="Contact your organization administrator to change your email"
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || isUnchanged || !fullName.trim()}
            >
              {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save changes'}
            </Button>
            <Fade in={justSaved}>
              <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                ✓ Saved
              </Typography>
            </Fade>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Roles
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {user.roles.length > 0 ? (
            user.roles.map((role) => <Chip key={role} label={role} color="primary" size="small" />)
          ) : (
            <Typography variant="body2" color="text.secondary">
              No roles assigned
            </Typography>
          )}
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Permissions ({user.permissions.length})
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {user.permissions.length > 0 ? (
            user.permissions.map((permission) => (
              <Chip key={permission} label={permission} variant="outlined" size="small" />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No permissions assigned
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Button
          variant="outlined"
          startIcon={<LockResetIcon />}
          onClick={() => navigate('/change-password')}
        >
          Change Password
        </Button>
      </Paper>
    </AppShell>
  );
}
