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
  IconButton,
  InputAdornment,
  MenuItem,
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
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import { AppShell } from '../components/AppShell';
import { ImportDialog } from '../components/ImportDialog';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';
import { exportToCsv } from '../utils/exportCsv';

interface Requirement {
  id: string;
  title: string;
  code: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  version: number;
  createdAt: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  createdByName: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
  code: string;
}

interface RequirementFormState {
  title: string;
  code: string;
  projectId: string;
  description: string;
  type: string;
  priority: string;
  status: string;
}

const TYPE_OPTIONS = ['Functional', 'Non-Functional', 'Business', 'Technical'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const STATUS_OPTIONS = ['Draft', 'In Review', 'Approved', 'Rejected', 'Deprecated'];
const STATUS_FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];

const EMPTY_FORM: RequirementFormState = {
  title: '',
  code: '',
  projectId: '',
  description: '',
  type: 'Functional',
  priority: 'Medium',
  status: 'Draft',
};

function statusColor(status: string): 'success' | 'info' | 'error' | 'default' {
  if (status === 'Approved') return 'success';
  if (status === 'In Review') return 'info';
  if (status === 'Rejected') return 'error';
  return 'default';
}

function priorityColor(priority: string): 'error' | 'warning' | 'info' | 'default' {
  if (priority === 'Critical') return 'error';
  if (priority === 'High') return 'warning';
  if (priority === 'Medium') return 'info';
  return 'default';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type DialogMode = 'create' | 'edit' | 'view' | null;

export function RequirementManagementPage() {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeRequirement, setActiveRequirement] = useState<Requirement | null>(null);
  const [form, setForm] = useState<RequirementFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Requirement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');

  const canCreate = user?.permissions.includes('requirement:create') ?? false;
  const canUpdate = user?.permissions.includes('requirement:update') ?? false;
  const canDelete = user?.permissions.includes('requirement:delete') ?? false;

  const loadRequirements = () => {
    setIsLoading(true);
    apiClient
      .get<Requirement[]>('/requirements')
      .then(({ data }) => {
        setRequirements(data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load requirements.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadRequirements();
    apiClient
      .get<ProjectOption[]>('/projects')
      .then(({ data }) => setProjects(data))
      .catch(() => undefined);
  }, []);

  const stats = useMemo(
    () => ({
      total: requirements.length,
      approved: requirements.filter((r) => r.status === 'Approved').length,
      inReview: requirements.filter((r) => r.status === 'In Review').length,
      draft: requirements.filter((r) => r.status === 'Draft').length,
    }),
    [requirements],
  );

  const filteredRequirements = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return requirements.filter((r) => {
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesProject = projectFilter === 'All' || r.projectId === projectFilter;
      const matchesSearch =
        !term ||
        r.title.toLowerCase().includes(term) ||
        r.code.toLowerCase().includes(term) ||
        r.projectName.toLowerCase().includes(term);
      return matchesStatus && matchesProject && matchesSearch;
    });
  }, [requirements, searchTerm, statusFilter, projectFilter]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?.id ?? '' });
    setFormError(null);
    setDialogMode('create');
  };

  const handleExport = () => {
    exportToCsv('requirements.csv', filteredRequirements, [
      { label: 'Title', value: (r) => r.title },
      { label: 'Code', value: (r) => r.code },
      { label: 'Project', value: (r) => r.projectName },
      { label: 'Type', value: (r) => r.type },
      { label: 'Priority', value: (r) => r.priority },
      { label: 'Status', value: (r) => r.status },
      { label: 'Version', value: (r) => r.version },
    ]);
  };

  const openEdit = (requirement: Requirement) => {
    setActiveRequirement(requirement);
    setForm({
      title: requirement.title,
      code: requirement.code,
      projectId: requirement.projectId,
      description: requirement.description ?? '',
      type: requirement.type,
      priority: requirement.priority,
      status: requirement.status,
    });
    setFormError(null);
    setDialogMode('edit');
  };

  const openView = (requirement: Requirement) => {
    setActiveRequirement(requirement);
    setDialogMode('view');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setActiveRequirement(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = {
      title: form.title.trim(),
      code: form.code.trim(),
      projectId: form.projectId,
      description: form.description.trim() || undefined,
      type: form.type,
      priority: form.priority,
      status: form.status,
    };

    try {
      if (dialogMode === 'create') {
        await apiClient.post('/requirements', payload);
        setToast('Requirement created');
      } else if (dialogMode === 'edit' && activeRequirement) {
        await apiClient.put(`/requirements/${activeRequirement.id}`, payload);
        setToast('Requirement updated');
      }
      closeDialog();
      loadRequirements();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to save this requirement.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/requirements/${deleteTarget.id}`);
      setToast('Requirement deleted');
      setDeleteTarget(null);
      loadRequirements();
    } catch (error) {
      setDeleteError(extractErrorMessage(error, 'Unable to delete this requirement.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell
      title="Requirement Management"
      actions={
        <>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
            Export
          </Button>
          {canCreate && (
            <Button
              variant="outlined"
              startIcon={<UploadFileOutlinedIcon />}
              onClick={() => setIsImportOpen(true)}
              disabled={projects.length === 0}
            >
              Import
            </Button>
          )}
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={projects.length === 0}>
              Create Requirement
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
          { label: 'Total Requirements', value: stats.total, Icon: DescriptionOutlinedIcon },
          { label: 'Approved', value: stats.approved, Icon: CheckCircleOutlinedIcon },
          { label: 'In Review', value: stats.inReview, Icon: HourglassEmptyOutlinedIcon },
          { label: 'Draft', value: stats.draft, Icon: EditNoteOutlinedIcon },
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
          placeholder="Search by title, code, or project"
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
          sx={{ minWidth: 150 }}
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Project"
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="All">All</MenuItem>
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
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
                <TableCell>Title</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Version</TableCell>
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
              ) : filteredRequirements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    {requirements.length === 0 ? 'No requirements yet.' : 'No requirements match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequirements.map((requirement) => (
                  <TableRow key={requirement.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <DescriptionOutlinedIcon sx={{ fontSize: 18, color: brand.teal }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {requirement.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{requirement.code}</TableCell>
                    <TableCell>{requirement.projectName}</TableCell>
                    <TableCell>{requirement.type}</TableCell>
                    <TableCell>
                      <Chip label={requirement.priority} size="small" color={priorityColor(requirement.priority)} />
                    </TableCell>
                    <TableCell>
                      <Chip label={requirement.status} size="small" color={statusColor(requirement.status)} />
                    </TableCell>
                    <TableCell>v{requirement.version}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(requirement)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(requirement)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(requirement)}>
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
        <DialogTitle>{dialogMode === 'create' ? 'Create Requirement' : 'Edit Requirement'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Title"
              required
              fullWidth
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Code"
                required
                fullWidth
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
              <TextField
                select
                label="Project"
                required
                fullWidth
                value={form.projectId}
                onChange={(event) => setForm({ ...form, projectId: event.target.value })}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Type"
                fullWidth
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                {TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Priority"
                fullWidth
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value })}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
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
            </Box>
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
        <DialogTitle>Requirement Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeRequirement && (
            <>
              {activeRequirement.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {activeRequirement.description}
                </Typography>
              )}
              {[
                ['Title', activeRequirement.title],
                ['Code', activeRequirement.code],
                ['Project', `${activeRequirement.projectName} (${activeRequirement.projectCode})`],
                ['Type', activeRequirement.type],
                ['Priority', activeRequirement.priority],
                ['Status', activeRequirement.status],
                ['Version', `v${activeRequirement.version}`],
                ['Created By', activeRequirement.createdByName || '—'],
                ['Approved By', activeRequirement.approvedByName || '—'],
                ['Approved At', formatDate(activeRequirement.approvedAt)],
                ['Created', formatDate(activeRequirement.createdAt)],
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
        <DialogTitle>Delete Requirement</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {deleteError && <Alert severity="error">{deleteError}</Alert>}
          <Typography variant="body2">
            Delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.
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

      <ImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Requirements"
        importUrl="/requirements/bulk-import"
        templateFilename="requirements-template.csv"
        templateColumns={['Title', 'Code', 'Type', 'Priority', 'Status', 'Description']}
        helperText="Title and Code are required."
        projects={projects}
        defaultProjectId={projectFilter !== 'All' ? projectFilter : undefined}
        onImported={loadRequirements}
      />
    </AppShell>
  );
}
