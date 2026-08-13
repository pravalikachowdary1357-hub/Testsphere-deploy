import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
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
import { AppShell } from '../components/AppShell';
import { LogoUpload } from '../components/LogoUpload';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Organization {
  id: string;
  name: string;
  code: string;
  status: string;
  licenseStatus: string;
  logoUrl: string | null;
  adminName: string | null;
  adminEmail: string | null;
  adminPhone: string | null;
  userCount: number;
}

interface OrgFormState {
  name: string;
  logoUrl: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
}

function toForm(org: Organization): OrgFormState {
  return {
    name: org.name,
    logoUrl: org.logoUrl ?? '',
    adminName: org.adminName ?? '',
    adminEmail: org.adminEmail ?? '',
    adminPhone: org.adminPhone ?? '',
  };
}

export function SettingsPage() {
  const { user } = useAuth();
  const canUpdate = user?.permissions.includes('organization:update') ?? false;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [form, setForm] = useState<OrgFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiClient
      .get<Organization>(`/organizations/${user.organizationId}`)
      .then(({ data }) => {
        setOrganization(data);
        setForm(toForm(data));
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load organization settings.')))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!user) {
    return null;
  }

  const isUnchanged = organization && form ? JSON.stringify(form) === JSON.stringify(toForm(organization)) : true;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!organization || !form || isUnchanged || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const { data } = await apiClient.put<Organization>(`/organizations/${organization.id}`, {
        name: form.name.trim(),
        logoUrl: form.logoUrl.trim() || null,
        adminName: form.adminName.trim() || undefined,
        adminEmail: form.adminEmail.trim() || undefined,
        adminPhone: form.adminPhone.trim() || undefined,
      });
      setOrganization(data);
      setForm(toForm(data));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (error) {
      setSaveError(extractErrorMessage(error, 'Unable to save organization settings.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Settings">
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : loadError || !organization || !form ? (
        <Alert severity="error">{loadError ?? 'Unable to load organization settings.'}</Alert>
      ) : (
        <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 }, maxWidth: 640, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Organization Profile
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {organization.code} &middot; {organization.userCount} user{organization.userCount === 1 ? '' : 's'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={organization.status} size="small" color={organization.status === 'Active' ? 'success' : 'default'} />
              <Chip label={organization.licenseStatus} size="small" variant="outlined" />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          {!canUpdate && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You have read-only access to these settings.
            </Alert>
          )}

          <Box component="form" noValidate onSubmit={handleSubmit}>
            <TextField
              label="Organization name"
              fullWidth
              margin="normal"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              disabled={isSaving || !canUpdate}
            />
            <Box sx={{ mt: 2, mb: 1 }}>
              <LogoUpload
                label="Organization logo"
                value={form.logoUrl}
                onChange={(value) => setForm({ ...form, logoUrl: value })}
                disabled={isSaving || !canUpdate}
              />
            </Box>
            <TextField
              label="Admin name"
              fullWidth
              margin="normal"
              value={form.adminName}
              onChange={(event) => setForm({ ...form, adminName: event.target.value })}
              disabled={isSaving || !canUpdate}
            />
            <TextField
              label="Admin email"
              fullWidth
              margin="normal"
              type="email"
              value={form.adminEmail}
              onChange={(event) => setForm({ ...form, adminEmail: event.target.value })}
              disabled={isSaving || !canUpdate}
            />
            <TextField
              label="Admin phone"
              fullWidth
              margin="normal"
              value={form.adminPhone}
              onChange={(event) => setForm({ ...form, adminPhone: event.target.value })}
              disabled={isSaving || !canUpdate}
            />

            {canUpdate && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                <Button type="submit" variant="contained" disabled={isSaving || isUnchanged || !form.name.trim()}>
                  {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save changes'}
                </Button>
                <Fade in={justSaved}>
                  <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                    ✓ Saved
                  </Typography>
                </Fade>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </AppShell>
  );
}
