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
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import { AppShell } from '../components/AppShell';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';
import { exportToCsv } from '../utils/exportCsv';

interface TestPlan {
  id: string;
  title: string;
  code: string;
  description: string | null;
  scope: string | null;
  strategy: string | null;
  entryCriteria: string | null;
  exitCriteria: string | null;
  environment: string | null;
  releaseVersion: string | null;
  status: string;
  version: number;
  startDate: string | null;
  endDate: string | null;
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

interface TestPlanFormState {
  title: string;
  code: string;
  projectId: string;
  releaseVersion: string;
  environment: string;
  description: string;
  scope: string;
  strategy: string;
  entryCriteria: string;
  exitCriteria: string;
  startDate: string;
  endDate: string;
  status: string;
}

const STATUS_OPTIONS = ['Draft', 'Pending Approval', 'Approved', 'In Progress', 'Completed', 'Rejected'];
const STATUS_FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];

const EMPTY_FORM: TestPlanFormState = {
  title: '',
  code: '',
  projectId: '',
  releaseVersion: '',
  environment: '',
  description: '',
  scope: '',
  strategy: '',
  entryCriteria: '',
  exitCriteria: '',
  startDate: '',
  endDate: '',
  status: 'Draft',
};

function statusColor(status: string): 'success' | 'info' | 'warning' | 'error' | 'default' {
  if (status === 'Approved' || status === 'Completed') return 'success';
  if (status === 'In Progress') return 'info';
  if (status === 'Pending Approval') return 'warning';
  if (status === 'Rejected') return 'error';
  return 'default';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type DialogMode = 'create' | 'edit' | 'view' | null;

export function TestPlanManagementPage() {
  const { user } = useAuth();
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeTestPlan, setActiveTestPlan] = useState<TestPlan | null>(null);
  const [form, setForm] = useState<TestPlanFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TestPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');

  const canCreate = user?.permissions.includes('testplan:create') ?? false;
  const canUpdate = user?.permissions.includes('testplan:update') ?? false;
  const canDelete = user?.permissions.includes('testplan:delete') ?? false;

  const loadTestPlans = () => {
    setIsLoading(true);
    apiClient
      .get<TestPlan[]>('/test-plans')
      .then(({ data }) => {
        setTestPlans(data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load test plans.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTestPlans();
    apiClient
      .get<ProjectOption[]>('/projects')
      .then(({ data }) => setProjects(data))
      .catch(() => undefined);
  }, []);

  const stats = useMemo(
    () => ({
      total: testPlans.length,
      approved: testPlans.filter((p) => p.status === 'Approved').length,
      pendingApproval: testPlans.filter((p) => p.status === 'Pending Approval').length,
      draft: testPlans.filter((p) => p.status === 'Draft').length,
    }),
    [testPlans],
  );

  const filteredTestPlans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return testPlans.filter((p) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesProject = projectFilter === 'All' || p.projectId === projectFilter;
      const matchesSearch =
        !term ||
        p.title.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.projectName.toLowerCase().includes(term);
      return matchesStatus && matchesProject && matchesSearch;
    });
  }, [testPlans, searchTerm, statusFilter, projectFilter]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?.id ?? '' });
    setFormError(null);
    setDialogMode('create');
  };

  const handleExport = () => {
    exportToCsv('test-plans.csv', filteredTestPlans, [
      { label: 'Title', value: (p) => p.title },
      { label: 'Code', value: (p) => p.code },
      { label: 'Project', value: (p) => p.projectName },
      { label: 'Release', value: (p) => p.releaseVersion },
      { label: 'Status', value: (p) => p.status },
      { label: 'Version', value: (p) => p.version },
    ]);
  };

  const openEdit = (testPlan: TestPlan) => {
    setActiveTestPlan(testPlan);
    setForm({
      title: testPlan.title,
      code: testPlan.code,
      projectId: testPlan.projectId,
      releaseVersion: testPlan.releaseVersion ?? '',
      environment: testPlan.environment ?? '',
      description: testPlan.description ?? '',
      scope: testPlan.scope ?? '',
      strategy: testPlan.strategy ?? '',
      entryCriteria: testPlan.entryCriteria ?? '',
      exitCriteria: testPlan.exitCriteria ?? '',
      startDate: testPlan.startDate ? testPlan.startDate.slice(0, 10) : '',
      endDate: testPlan.endDate ? testPlan.endDate.slice(0, 10) : '',
      status: testPlan.status,
    });
    setFormError(null);
    setDialogMode('edit');
  };

  const openView = (testPlan: TestPlan) => {
    setActiveTestPlan(testPlan);
    setDialogMode('view');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setActiveTestPlan(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = {
      title: form.title.trim(),
      code: form.code.trim(),
      projectId: form.projectId,
      releaseVersion: form.releaseVersion.trim() || undefined,
      environment: form.environment.trim() || undefined,
      description: form.description.trim() || undefined,
      scope: form.scope.trim() || undefined,
      strategy: form.strategy.trim() || undefined,
      entryCriteria: form.entryCriteria.trim() || undefined,
      exitCriteria: form.exitCriteria.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status,
    };

    try {
      if (dialogMode === 'create') {
        await apiClient.post('/test-plans', payload);
        setToast('Test plan created');
      } else if (dialogMode === 'edit' && activeTestPlan) {
        await apiClient.put(`/test-plans/${activeTestPlan.id}`, payload);
        setToast('Test plan updated');
      }
      closeDialog();
      loadTestPlans();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to save this test plan.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/test-plans/${deleteTarget.id}`);
      setToast('Test plan deleted');
      setDeleteTarget(null);
      loadTestPlans();
    } catch (error) {
      setDeleteError(extractErrorMessage(error, 'Unable to delete this test plan.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell
      title="Test Plan Management"
      actions={
        <>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
            Export
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={projects.length === 0}>
              Create Test Plan
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
          { label: 'Total Test Plans', value: stats.total, Icon: EventNoteOutlinedIcon },
          { label: 'Approved', value: stats.approved, Icon: CheckCircleOutlinedIcon },
          { label: 'Pending Approval', value: stats.pendingApproval, Icon: HourglassEmptyOutlinedIcon },
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
          sx={{ minWidth: 170 }}
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
                <TableCell>Release</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Version</TableCell>
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
              ) : filteredTestPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    {testPlans.length === 0 ? 'No test plans yet.' : 'No test plans match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTestPlans.map((testPlan) => (
                  <TableRow key={testPlan.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <EventNoteOutlinedIcon sx={{ fontSize: 18, color: brand.teal }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {testPlan.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{testPlan.code}</TableCell>
                    <TableCell>{testPlan.projectName}</TableCell>
                    <TableCell>{testPlan.releaseVersion || '—'}</TableCell>
                    <TableCell>
                      <Chip label={testPlan.status} size="small" color={statusColor(testPlan.status)} />
                    </TableCell>
                    <TableCell>v{testPlan.version}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(testPlan)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(testPlan)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(testPlan)}>
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
      <Dialog open={dialogMode === 'create' || dialogMode === 'edit'} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Create Test Plan' : 'Edit Test Plan'}</DialogTitle>
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
              <TextField
                label="Release Version"
                fullWidth
                placeholder="e.g. 4.2"
                value={form.releaseVersion}
                onChange={(event) => setForm({ ...form, releaseVersion: event.target.value })}
              />
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
                label="Scope"
                fullWidth
                multiline
                minRows={2}
                value={form.scope}
                onChange={(event) => setForm({ ...form, scope: event.target.value })}
              />
              <TextField
                label="Strategy"
                fullWidth
                multiline
                minRows={2}
                value={form.strategy}
                onChange={(event) => setForm({ ...form, strategy: event.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Entry Criteria"
                fullWidth
                multiline
                minRows={2}
                value={form.entryCriteria}
                onChange={(event) => setForm({ ...form, entryCriteria: event.target.value })}
              />
              <TextField
                label="Exit Criteria"
                fullWidth
                multiline
                minRows={2}
                value={form.exitCriteria}
                onChange={(event) => setForm({ ...form, exitCriteria: event.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Environment"
                fullWidth
                placeholder="e.g. Staging-2"
                value={form.environment}
                onChange={(event) => setForm({ ...form, environment: event.target.value })}
              />
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
        <DialogTitle>Test Plan Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeTestPlan && (
            <>
              {activeTestPlan.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {activeTestPlan.description}
                </Typography>
              )}
              {[
                ['Title', activeTestPlan.title],
                ['Code', activeTestPlan.code],
                ['Project', `${activeTestPlan.projectName} (${activeTestPlan.projectCode})`],
                ['Release', activeTestPlan.releaseVersion || '—'],
                ['Environment', activeTestPlan.environment || '—'],
                ['Scope', activeTestPlan.scope || '—'],
                ['Strategy', activeTestPlan.strategy || '—'],
                ['Entry Criteria', activeTestPlan.entryCriteria || '—'],
                ['Exit Criteria', activeTestPlan.exitCriteria || '—'],
                ['Status', activeTestPlan.status],
                ['Version', `v${activeTestPlan.version}`],
                ['Start Date', formatDate(activeTestPlan.startDate)],
                ['End Date', formatDate(activeTestPlan.endDate)],
                ['Created By', activeTestPlan.createdByName || '—'],
                ['Approved By', activeTestPlan.approvedByName || '—'],
                ['Approved At', formatDate(activeTestPlan.approvedAt)],
                ['Created', formatDate(activeTestPlan.createdAt)],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
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
        <DialogTitle>Delete Test Plan</DialogTitle>
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
    </AppShell>
  );
}
