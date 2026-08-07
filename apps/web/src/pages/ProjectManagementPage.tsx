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
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { AppShell } from '../components/AppShell';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  projectManagerId: string | null;
  projectManagerName: string | null;
  projectManagerEmail: string | null;
}

interface OrgUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
}

interface ProjectFormState {
  name: string;
  code: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  projectManagerId: string;
}

const STATUS_OPTIONS = ['Active', 'On Hold', 'Completed', 'Cancelled'];
const STATUS_FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];

const EMPTY_FORM: ProjectFormState = {
  name: '',
  code: '',
  description: '',
  status: 'Active',
  startDate: '',
  endDate: '',
  projectManagerId: '',
};

function statusColor(status: string): 'success' | 'warning' | 'default' | 'error' {
  if (status === 'Active') return 'success';
  if (status === 'On Hold') return 'warning';
  if (status === 'Cancelled') return 'error';
  return 'default';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type DialogMode = 'create' | 'edit' | 'view' | null;

export function ProjectManagementPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const canCreate = user?.permissions.includes('project:create') ?? false;
  const canUpdate = user?.permissions.includes('project:update') ?? false;
  const canDelete = user?.permissions.includes('project:delete') ?? false;

  const loadProjects = () => {
    setIsLoading(true);
    apiClient
      .get<Project[]>('/projects')
      .then(({ data }) => {
        setProjects(data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load projects.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProjects();
    apiClient
      .get<OrgUser[]>('/users')
      .then(({ data }) => setOrgUsers(data))
      .catch(() => undefined);
  }, []);

  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((p) => p.status === 'Active').length,
      onHold: projects.filter((p) => p.status === 'On Hold').length,
      completed: projects.filter((p) => p.status === 'Completed').length,
    }),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        (p.projectManagerName ?? '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [projects, searchTerm, statusFilter]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogMode('create');
  };

  const openEdit = (project: Project) => {
    setActiveProject(project);
    setForm({
      name: project.name,
      code: project.code,
      description: project.description ?? '',
      status: project.status,
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      endDate: project.endDate ? project.endDate.slice(0, 10) : '',
      projectManagerId: project.projectManagerId ?? '',
    });
    setFormError(null);
    setDialogMode('edit');
  };

  const openView = (project: Project) => {
    setActiveProject(project);
    setDialogMode('view');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setActiveProject(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      projectManagerId: form.projectManagerId || undefined,
    };

    try {
      if (dialogMode === 'create') {
        await apiClient.post('/projects', payload);
        setToast('Project created');
      } else if (dialogMode === 'edit' && activeProject) {
        await apiClient.put(`/projects/${activeProject.id}`, payload);
        setToast('Project updated');
      }
      closeDialog();
      loadProjects();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to save this project.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/projects/${deleteTarget.id}`);
      setToast('Project deleted');
      setDeleteTarget(null);
      loadProjects();
    } catch (error) {
      setDeleteError(extractErrorMessage(error, 'Unable to delete this project.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell title="Project Management">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: 'Total Projects', value: stats.total, Icon: WorkOutlineOutlinedIcon },
          { label: 'Active', value: stats.active, Icon: CheckCircleOutlinedIcon },
          { label: 'On Hold', value: stats.onHold, Icon: PauseCircleOutlinedIcon },
          { label: 'Completed', value: stats.completed, Icon: TaskAltOutlinedIcon },
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

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search by name, code, or manager"
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
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Create Project
          </Button>
        )}
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
                <TableCell>Project Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Project Manager</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    {projects.length === 0 ? 'No projects yet.' : 'No projects match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <WorkOutlineOutlinedIcon sx={{ fontSize: 18, color: brand.teal }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {project.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{project.code}</TableCell>
                    <TableCell>{project.projectManagerName || '—'}</TableCell>
                    <TableCell>
                      <Chip label={project.status} size="small" color={statusColor(project.status)} />
                    </TableCell>
                    <TableCell>{formatDate(project.startDate)}</TableCell>
                    <TableCell>{formatDate(project.endDate)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(project)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(project)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(project)}>
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
        <DialogTitle>{dialogMode === 'create' ? 'Create Project' : 'Edit Project'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Project Name"
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
              <TextField
                select
                label="Project Manager"
                fullWidth
                value={form.projectManagerId}
                onChange={(event) => setForm({ ...form, projectManagerId: event.target.value })}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {orgUsers.map((orgUser) => (
                  <MenuItem key={orgUser.id} value={orgUser.id}>
                    {orgUser.fullName}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
              <TextField
                label="End Date"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
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
        <DialogTitle>Project Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeProject && (
            <>
              {activeProject.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {activeProject.description}
                </Typography>
              )}
              {[
                ['Name', activeProject.name],
                ['Code', activeProject.code],
                ['Status', activeProject.status],
                ['Project Manager', activeProject.projectManagerName || '—'],
                ['Manager Email', activeProject.projectManagerEmail || '—'],
                ['Start Date', formatDate(activeProject.startDate)],
                ['End Date', formatDate(activeProject.endDate)],
                ['Created', formatDate(activeProject.createdAt)],
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
        <DialogTitle>Delete Project</DialogTitle>
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
