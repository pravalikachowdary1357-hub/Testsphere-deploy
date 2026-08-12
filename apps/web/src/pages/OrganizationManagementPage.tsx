import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
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
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { AppShell } from '../components/AppShell';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';
import { exportToCsv } from '../utils/exportCsv';

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
  createdAt: string;
  userCount: number;
}

interface OrganizationFormState {
  name: string;
  code: string;
  status: string;
  licenseStatus: string;
  logoUrl: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
}

interface OrgUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
}

const STATUS_OPTIONS = ['Active', 'Suspended', 'Inactive'];
const STATUS_FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];
const LICENSE_OPTIONS = ['Trial', 'Licensed', 'Expired'];

const EMPTY_FORM: OrganizationFormState = {
  name: '',
  code: '',
  status: 'Active',
  licenseStatus: 'Trial',
  logoUrl: '',
  adminName: '',
  adminEmail: '',
  adminPhone: '',
};

function statusColor(status: string): 'success' | 'warning' | 'default' {
  if (status === 'Active') return 'success';
  if (status === 'Suspended') return 'warning';
  return 'default';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type DialogMode = 'create' | 'edit' | 'view' | null;

export function OrganizationManagementPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [form, setForm] = useState<OrganizationFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [assignTarget, setAssignTarget] = useState<Organization | null>(null);
  const [assignUsers, setAssignUsers] = useState<OrgUser[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [isLoadingAssignUsers, setIsLoadingAssignUsers] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const canCreate = user?.permissions.includes('organization:create') ?? false;
  const canUpdate = user?.permissions.includes('organization:update') ?? false;
  const canDelete = user?.permissions.includes('organization:delete') ?? false;

  const loadOrganizations = () => {
    setIsLoading(true);
    apiClient
      .get<Organization[]>('/organizations')
      .then(({ data }) => {
        setOrganizations(data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load organizations.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const stats = useMemo(
    () => ({
      total: organizations.length,
      active: organizations.filter((org) => org.status === 'Active').length,
      inactive: organizations.filter((org) => org.status !== 'Active').length,
      totalUsers: organizations.reduce((sum, org) => sum + org.userCount, 0),
    }),
    [organizations],
  );

  const filteredOrganizations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return organizations.filter((org) => {
      const matchesStatus = statusFilter === 'All' || org.status === statusFilter;
      const matchesSearch =
        !term ||
        org.name.toLowerCase().includes(term) ||
        org.code.toLowerCase().includes(term) ||
        (org.adminName ?? '').toLowerCase().includes(term) ||
        (org.adminEmail ?? '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [organizations, searchTerm, statusFilter]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogMode('create');
  };

  const handleExport = () => {
    exportToCsv('organizations.csv', filteredOrganizations, [
      { label: 'Organization Name', value: (o) => o.name },
      { label: 'Code', value: (o) => o.code },
      { label: 'Admin', value: (o) => o.adminName },
      { label: 'Email', value: (o) => o.adminEmail },
      { label: 'Phone', value: (o) => o.adminPhone },
      { label: 'Status', value: (o) => o.status },
      { label: 'License Status', value: (o) => o.licenseStatus },
      { label: 'Total Users', value: (o) => o.userCount },
      { label: 'Created Date', value: (o) => formatDate(o.createdAt) },
    ]);
  };

  const openEdit = (org: Organization) => {
    setActiveOrg(org);
    setForm({
      name: org.name,
      code: org.code,
      status: org.status,
      licenseStatus: org.licenseStatus,
      logoUrl: org.logoUrl ?? '',
      adminName: org.adminName ?? '',
      adminEmail: org.adminEmail ?? '',
      adminPhone: org.adminPhone ?? '',
    });
    setFormError(null);
    setDialogMode('edit');
  };

  const openView = (org: Organization) => {
    setActiveOrg(org);
    setDialogMode('view');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setActiveOrg(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      status: form.status,
      licenseStatus: form.licenseStatus,
      logoUrl: form.logoUrl.trim() || undefined,
      adminName: form.adminName.trim() || undefined,
      adminEmail: form.adminEmail.trim() || undefined,
      adminPhone: form.adminPhone.trim() || undefined,
    };

    try {
      if (dialogMode === 'create') {
        await apiClient.post('/organizations', payload);
        setToast('Organization created');
      } else if (dialogMode === 'edit' && activeOrg) {
        await apiClient.put(`/organizations/${activeOrg.id}`, payload);
        setToast('Organization updated');
      }
      closeDialog();
      loadOrganizations();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to save this organization.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/organizations/${deleteTarget.id}`);
      setToast('Organization deleted');
      setDeleteTarget(null);
      loadOrganizations();
    } catch (error) {
      setDeleteError(extractErrorMessage(error, 'Unable to delete this organization.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const openAssignAdmin = (org: Organization) => {
    setAssignTarget(org);
    setSelectedAdminId(null);
    setAssignError(null);
    setIsLoadingAssignUsers(true);
    apiClient
      .get<OrgUser[]>(`/organizations/${org.id}/users`)
      .then(({ data }) => setAssignUsers(data))
      .catch((error) => setAssignError(extractErrorMessage(error, 'Unable to load this organization\'s users.')))
      .finally(() => setIsLoadingAssignUsers(false));
  };

  const closeAssignAdmin = () => {
    setAssignTarget(null);
    setAssignUsers([]);
    setSelectedAdminId(null);
  };

  const handleAssignAdmin = async () => {
    if (!assignTarget || !selectedAdminId) return;
    setIsAssigning(true);
    setAssignError(null);
    try {
      await apiClient.put(`/organizations/${assignTarget.id}/admin`, { userId: selectedAdminId });
      setToast('Organization admin assigned');
      closeAssignAdmin();
      loadOrganizations();
    } catch (error) {
      setAssignError(extractErrorMessage(error, 'Unable to assign this organization admin.'));
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <AppShell
      title="Organization Management"
      actions={
        <>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
            Export
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Create Organization
            </Button>
          )}
        </>
      }
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: 'Total Organizations', value: stats.total, Icon: CorporateFareOutlinedIcon },
          { label: 'Active', value: stats.active, Icon: CheckCircleOutlinedIcon },
          { label: 'Inactive / Suspended', value: stats.inactive, Icon: CancelOutlinedIcon },
          { label: 'Total Users', value: stats.totalUsers, Icon: GroupsOutlinedIcon },
        ].map((card) => (
          <Paper key={card.label} elevation={0} sx={{ p: 2.25, borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: `${brand.teal}16`,
                color: brand.teal,
                mb: 1.25,
              }}
            >
              <card.Icon sx={{ fontSize: 19 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: brand.tealDark, lineHeight: 1 }}>
              {card.value}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'text.secondary', fontWeight: 600 }}>
              {card.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by name, code, or admin"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          sx={{ minWidth: 160 }}
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {loadError}
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Organization Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    {organizations.length === 0 ? 'No organizations yet.' : 'No organizations match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org) => (
                  <TableRow key={org.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <CorporateFareOutlinedIcon sx={{ fontSize: 18, color: brand.teal }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {org.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{org.code}</TableCell>
                    <TableCell>{org.adminName || '—'}</TableCell>
                    <TableCell>{org.adminEmail || '—'}</TableCell>
                    <TableCell>{org.adminPhone || '—'}</TableCell>
                    <TableCell>
                      <Chip label={org.status} size="small" color={statusColor(org.status)} />
                    </TableCell>
                    <TableCell>{formatDate(org.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(org)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(org)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canUpdate && (
                        <Tooltip title="Assign Organization Admin">
                          <IconButton size="small" onClick={() => openAssignAdmin(org)}>
                            <AdminPanelSettingsOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(org)}>
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

      {/* Create / Edit dialog */}
      <Dialog open={dialogMode === 'create' || dialogMode === 'edit'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Create Organization' : 'Edit Organization'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Organization Name"
              required
              fullWidth
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <TextField
              label="Code"
              required
              fullWidth
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Organization Status"
                fullWidth
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="License Status"
                fullWidth
                value={form.licenseStatus}
                onChange={(event) => setForm({ ...form, licenseStatus: event.target.value })}
              >
                {LICENSE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Organization Logo URL"
              fullWidth
              placeholder="https://..."
              value={form.logoUrl}
              onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
            />
            <Divider>Contact Details</Divider>
            <TextField
              label="Admin Name"
              fullWidth
              value={form.adminName}
              onChange={(event) => setForm({ ...form, adminName: event.target.value })}
            />
            <TextField
              label="Admin Email"
              type="email"
              fullWidth
              value={form.adminEmail}
              onChange={(event) => setForm({ ...form, adminEmail: event.target.value })}
            />
            <TextField
              label="Admin Phone"
              fullWidth
              value={form.adminPhone}
              onChange={(event) => setForm({ ...form, adminPhone: event.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* View dialog */}
      <Dialog open={dialogMode === 'view'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Organization Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeOrg && (
            <>
              {activeOrg.logoUrl && (
                <Box component="img" src={activeOrg.logoUrl} alt={activeOrg.name} sx={{ height: 56, mb: 1 }} />
              )}
              {[
                ['Name', activeOrg.name],
                ['Code', activeOrg.code],
                ['Status', activeOrg.status],
                ['License Status', activeOrg.licenseStatus],
                ['Admin', activeOrg.adminName || '—'],
                ['Email', activeOrg.adminEmail || '—'],
                ['Phone', activeOrg.adminPhone || '—'],
                ['Users', String(activeOrg.userCount)],
                ['Created', formatDate(activeOrg.createdAt)],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Organization</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {deleteError && <Alert severity="error">{deleteError}</Alert>}
          <Typography variant="body2">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
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

      {/* Assign Organization Admin */}
      <Dialog open={Boolean(assignTarget)} onClose={closeAssignAdmin} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Organization Admin — {assignTarget?.name}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {assignError && <Alert severity="error">{assignError}</Alert>}
          <Typography variant="body2" color="text.secondary">
            Choose a user from this organization to designate as its Organization Admin.
          </Typography>
          {isLoadingAssignUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : assignUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              This organization has no users yet.
            </Typography>
          ) : (
            <List sx={{ border: '1px solid rgba(11,36,48,0.08)', borderRadius: 2 }}>
              {assignUsers.map((orgUser) => (
                <ListItemButton
                  key={orgUser.id}
                  selected={selectedAdminId === orgUser.id}
                  onClick={() => setSelectedAdminId(orgUser.id)}
                  disabled={!orgUser.isActive}
                >
                  <Radio checked={selectedAdminId === orgUser.id} size="small" sx={{ mr: 1 }} />
                  <ListItemText
                    primary={orgUser.fullName}
                    secondary={`${orgUser.email}${orgUser.isActive ? '' : ' · Inactive'}`}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeAssignAdmin} disabled={isAssigning}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAssignAdmin} disabled={isAssigning || !selectedAdminId}>
            {isAssigning ? <CircularProgress size={20} color="inherit" /> : 'Assign'}
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
