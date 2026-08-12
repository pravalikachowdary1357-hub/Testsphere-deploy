import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { AppShell } from '../components/AppShell';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { exportToCsv } from '../utils/exportCsv';

interface Permission {
  id: string;
  key: string;
  description: string | null;
}

export function PermissionManagementPage() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ key: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canCreate = user?.permissions.includes('permission:create') ?? false;

  const load = () => {
    setIsLoading(true);
    apiClient
      .get<Permission[]>('/permissions')
      .then(({ data }) => {
        setPermissions(data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load permissions.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleExport = () => {
    exportToCsv('permissions.csv', permissions, [
      { label: 'Key', value: (p) => p.key },
      { label: 'Description', value: (p) => p.description },
    ]);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      await apiClient.post('/permissions', {
        key: form.key.trim(),
        description: form.description.trim() || undefined,
      });
      setToast('Permission created');
      setCreateOpen(false);
      setForm({ key: '', description: '' });
      load();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to create this permission.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      title="Permission Management"
      actions={
        <>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
            Export
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Create Permission
            </Button>
          )}
        </>
      }
    >
      {loadError && <Alert severity="error" sx={{ mb: 3 }}>{loadError}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map((permission) => (
                  <TableRow key={permission.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{permission.key}</TableCell>
                    <TableCell>{permission.description || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Permission</DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Key"
              required
              fullWidth
              placeholder="resource:action"
              helperText='e.g. "project:read"'
              value={form.key}
              onChange={(event) => setForm({ ...form, key: event.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCreateOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={toast}
      />
    </AppShell>
  );
}
