import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { AppShell } from '../components/AppShell';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Permission {
  id: string;
  key: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Array<{ permission: Permission }>;
}

export function RoleManagementPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [permissionsTarget, setPermissionsTarget] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const canCreate = user?.permissions.includes('role:create') ?? false;
  const canUpdate = user?.permissions.includes('role:update') ?? false;
  const canDelete = user?.permissions.includes('role:delete') ?? false;

  const load = () => {
    setIsLoading(true);
    Promise.all([apiClient.get<Role[]>('/roles'), apiClient.get<Permission[]>('/permissions')])
      .then(([rolesRes, permissionsRes]) => {
        setRoles(rolesRes.data);
        setAllPermissions(permissionsRes.data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load roles.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      await apiClient.post('/roles', {
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
      });
      setToast('Role created');
      setCreateOpen(false);
      setCreateForm({ name: '', description: '' });
      load();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to create this role.'));
    } finally {
      setIsSaving(false);
    }
  };

  const openPermissions = (role: Role) => {
    setPermissionsTarget(role);
    setSelectedPermissionIds(new Set(role.permissions.map((p) => p.permission.id)));
  };

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const savePermissions = async () => {
    if (!permissionsTarget) return;
    setIsSaving(true);
    setFormError(null);
    try {
      await apiClient.put(`/roles/${permissionsTarget.id}/permissions`, {
        permissionIds: Array.from(selectedPermissionIds),
      });
      setToast('Permissions updated');
      setPermissionsTarget(null);
      load();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to update permissions.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/roles/${deleteTarget.id}`);
      setToast('Role deleted');
      setDeleteTarget(null);
      load();
    } catch (error) {
      setDeleteError(extractErrorMessage(error, 'Unable to delete this role.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell title="Role Management">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create Role
          </Button>
        )}
      </Box>

      {loadError && <Alert severity="error" sx={{ mb: 3 }}>{loadError}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{role.name}</TableCell>
                    <TableCell>{role.description || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 360 }}>
                        {role.permissions.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            None
                          </Typography>
                        ) : (
                          role.permissions.slice(0, 4).map((p) => (
                            <Chip key={p.permission.id} label={p.permission.key} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                          ))
                        )}
                        {role.permissions.length > 4 && (
                          <Chip label={`+${role.permissions.length - 4}`} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {canUpdate && (
                        <Tooltip title="Edit permissions">
                          <IconButton size="small" onClick={() => openPermissions(role)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(role)}>
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Role</DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Role Name"
              required
              fullWidth
              value={createForm.name}
              onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={createForm.description}
              onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })}
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

      <Dialog open={Boolean(permissionsTarget)} onClose={() => setPermissionsTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Permissions · {permissionsTarget?.name}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {formError && <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert>}
          {allPermissions.map((permission) => (
            <FormControlLabel
              key={permission.id}
              control={
                <Checkbox
                  checked={selectedPermissionIds.has(permission.id)}
                  onChange={() => togglePermission(permission.id)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {permission.key}
                  </Typography>
                  {permission.description && (
                    <Typography variant="caption" color="text.secondary">
                      {permission.description}
                    </Typography>
                  )}
                </Box>
              }
            />
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPermissionsTarget(null)} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={savePermissions} disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {deleteError && <Alert severity="error">{deleteError}</Alert>}
          <Typography variant="body2">
            Delete <strong>{deleteTarget?.name}</strong>? Users holding this role will lose the permissions it grants.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
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
