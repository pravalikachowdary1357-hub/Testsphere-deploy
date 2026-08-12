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
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { AppShell } from '../components/AppShell';
import { ImportDialog } from '../components/ImportDialog';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';
import { exportToCsv } from '../utils/exportCsv';

interface Defect {
  id: string;
  code: string;
  title: string;
  description: string | null;
  stepsToReproduce: string | null;
  severity: string;
  priority: string;
  status: string;
  environment: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  testExecutionId: string | null;
  testExecutionCode: string | null;
  testExecutionResult: string | null;
  testCaseTitle: string | null;
  testCaseCode: string | null;
  requirementId: string | null;
  requirementTitle: string | null;
  requirementCode: string | null;
  reportedByName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  resolvedByName: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
  code: string;
}

interface TestExecutionOption {
  id: string;
  code: string;
  result: string;
  projectId: string;
  testCaseCode: string;
  testCaseTitle: string;
}

interface RequirementOption {
  id: string;
  title: string;
  code: string;
  projectId: string;
}

interface UserOption {
  id: string;
  fullName: string;
  isActive: boolean;
}

interface DefectFormState {
  code: string;
  projectId: string;
  title: string;
  severity: string;
  priority: string;
  status: string;
  testExecutionId: string;
  requirementId: string;
  assignedToId: string;
  environment: string;
  description: string;
  stepsToReproduce: string;
  resolution: string;
}

const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const STATUS_OPTIONS = [
  'New',
  'Assigned',
  'In Progress',
  'Retest',
  'Closed',
  'Rejected',
  'Duplicate',
  'Deferred',
  'Reopened',
  'Cannot Reproduce',
];
const SEVERITY_FILTER_OPTIONS = ['All', ...SEVERITY_OPTIONS];
const STATUS_FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];
const TERMINAL_STATUSES = ['Closed', 'Rejected', 'Duplicate', 'Cannot Reproduce'];

const EMPTY_FORM: DefectFormState = {
  code: '',
  projectId: '',
  title: '',
  severity: 'Medium',
  priority: 'Medium',
  status: 'New',
  testExecutionId: '',
  requirementId: '',
  assignedToId: '',
  environment: '',
  description: '',
  stepsToReproduce: '',
  resolution: '',
};

function severityColor(severity: string): 'error' | 'warning' | 'info' | 'default' {
  if (severity === 'Critical') return 'error';
  if (severity === 'High') return 'warning';
  if (severity === 'Medium') return 'info';
  return 'default';
}

function statusColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  if (status === 'Closed') return 'success';
  if (status === 'Reopened') return 'error';
  if (status === 'In Progress' || status === 'Retest') return 'warning';
  if (status === 'Assigned') return 'info';
  return 'default';
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

type DialogMode = 'create' | 'edit' | 'view' | null;

export function DefectManagementPage() {
  const { user } = useAuth();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [testExecutionOptions, setTestExecutionOptions] = useState<TestExecutionOption[]>([]);
  const [requirementOptions, setRequirementOptions] = useState<RequirementOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeDefect, setActiveDefect] = useState<Defect | null>(null);
  const [form, setForm] = useState<DefectFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Defect | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');

  const canCreate = user?.permissions.includes('defect:create') ?? false;
  const canUpdate = user?.permissions.includes('defect:update') ?? false;
  const canDelete = user?.permissions.includes('defect:delete') ?? false;

  const loadDefects = () => {
    setIsLoading(true);
    apiClient
      .get<Defect[]>('/defects')
      .then(({ data }) => {
        setDefects(data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load defects.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDefects();
    apiClient.get<ProjectOption[]>('/projects').then(({ data }) => setProjects(data)).catch(() => undefined);
    apiClient.get<TestExecutionOption[]>('/test-executions').then(({ data }) => setTestExecutionOptions(data)).catch(() => undefined);
    apiClient.get<RequirementOption[]>('/requirements').then(({ data }) => setRequirementOptions(data)).catch(() => undefined);
    apiClient.get<UserOption[]>('/users').then(({ data }) => setUserOptions(data)).catch(() => undefined);
  }, []);

  const stats = useMemo(
    () => ({
      total: defects.length,
      open: defects.filter((d) => !TERMINAL_STATUSES.includes(d.status)).length,
      openCritical: defects.filter((d) => d.severity === 'Critical' && !TERMINAL_STATUSES.includes(d.status)).length,
      closed: defects.filter((d) => d.status === 'Closed').length,
    }),
    [defects],
  );

  const filteredDefects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return defects.filter((d) => {
      const matchesSeverity = severityFilter === 'All' || d.severity === severityFilter;
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      const matchesProject = projectFilter === 'All' || d.projectId === projectFilter;
      const matchesSearch = !term || d.code.toLowerCase().includes(term) || d.title.toLowerCase().includes(term);
      return matchesSeverity && matchesStatus && matchesProject && matchesSearch;
    });
  }, [defects, searchTerm, severityFilter, statusFilter, projectFilter]);

  const executionsForProject = (projectId: string) => testExecutionOptions.filter((te) => te.projectId === projectId);
  const requirementsForProject = (projectId: string) => requirementOptions.filter((r) => r.projectId === projectId);
  const activeUsers = userOptions.filter((u) => u.isActive);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?.id ?? '' });
    setFormError(null);
    setDialogMode('create');
  };

  const handleExport = () => {
    exportToCsv('defects.csv', filteredDefects, [
      { label: 'Code', value: (d) => d.code },
      { label: 'Title', value: (d) => d.title },
      { label: 'Project', value: (d) => d.projectName },
      { label: 'Severity', value: (d) => d.severity },
      { label: 'Priority', value: (d) => d.priority },
      { label: 'Status', value: (d) => d.status },
      { label: 'Assigned To', value: (d) => d.assignedToName },
    ]);
  };

  const openEdit = (defect: Defect) => {
    setActiveDefect(defect);
    setForm({
      code: defect.code,
      projectId: defect.projectId,
      title: defect.title,
      severity: defect.severity,
      priority: defect.priority,
      status: defect.status,
      testExecutionId: defect.testExecutionId ?? '',
      requirementId: defect.requirementId ?? '',
      assignedToId: defect.assignedToId ?? '',
      environment: defect.environment ?? '',
      description: defect.description ?? '',
      stepsToReproduce: defect.stepsToReproduce ?? '',
      resolution: defect.resolution ?? '',
    });
    setFormError(null);
    setDialogMode('edit');
  };

  const openView = (defect: Defect) => {
    setActiveDefect(defect);
    setDialogMode('view');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setActiveDefect(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = {
      code: form.code.trim(),
      projectId: form.projectId,
      title: form.title.trim(),
      severity: form.severity,
      priority: form.priority,
      status: form.status,
      testExecutionId: form.testExecutionId || undefined,
      requirementId: form.requirementId || undefined,
      assignedToId: form.assignedToId || undefined,
      environment: form.environment.trim() || undefined,
      description: form.description.trim() || undefined,
      stepsToReproduce: form.stepsToReproduce.trim() || undefined,
      resolution: form.resolution.trim() || undefined,
    };

    try {
      if (dialogMode === 'create') {
        await apiClient.post('/defects', payload);
        setToast('Defect reported');
      } else if (dialogMode === 'edit' && activeDefect) {
        await apiClient.put(`/defects/${activeDefect.id}`, payload);
        setToast('Defect updated');
      }
      closeDialog();
      loadDefects();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to save this defect.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/defects/${deleteTarget.id}`);
      setToast('Defect deleted');
      setDeleteTarget(null);
      loadDefects();
    } catch (error) {
      setDeleteError(extractErrorMessage(error, 'Unable to delete this defect.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell
      title="Defect Management"
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
              Report Defect
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
          { label: 'Total Defects', value: stats.total, Icon: BugReportOutlinedIcon },
          { label: 'Open', value: stats.open, Icon: ReportProblemOutlinedIcon },
          { label: 'Open Critical', value: stats.openCritical, Icon: ErrorOutlineOutlinedIcon },
          { label: 'Closed', value: stats.closed, Icon: CheckCircleOutlinedIcon },
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
          placeholder="Search by code or title"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          sx={{ minWidth: 240 }}
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
          label="Severity"
          value={severityFilter}
          onChange={(event) => setSeverityFilter(event.target.value)}
          sx={{ minWidth: 140 }}
        >
          {SEVERITY_FILTER_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
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
                <TableCell>Code</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
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
              ) : filteredDefects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    {defects.length === 0 ? 'No defects yet.' : 'No defects match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDefects.map((defect) => (
                  <TableRow key={defect.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <BugReportOutlinedIcon sx={{ fontSize: 18, color: brand.teal }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {defect.code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{defect.title}</TableCell>
                    <TableCell>{defect.projectName}</TableCell>
                    <TableCell>
                      <Chip label={defect.severity} size="small" color={severityColor(defect.severity)} />
                    </TableCell>
                    <TableCell>{defect.priority}</TableCell>
                    <TableCell>
                      <Chip label={defect.status} size="small" color={statusColor(defect.status)} />
                    </TableCell>
                    <TableCell>{defect.assignedToName || '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(defect)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(defect)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(defect)}>
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
        <DialogTitle>{dialogMode === 'create' ? 'Report Defect' : 'Edit Defect'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
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
                onChange={(event) =>
                  setForm({ ...form, projectId: event.target.value, testExecutionId: '', requirementId: '' })
                }
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Severity"
                required
                fullWidth
                value={form.severity}
                onChange={(event) => setForm({ ...form, severity: event.target.value })}
              >
                {SEVERITY_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Title"
              required
              fullWidth
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
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
              <TextField
                label="Environment"
                fullWidth
                placeholder="e.g. Staging-2"
                value={form.environment}
                onChange={(event) => setForm({ ...form, environment: event.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Test Execution"
                fullWidth
                disabled={!form.projectId}
                value={form.testExecutionId}
                onChange={(event) => setForm({ ...form, testExecutionId: event.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {executionsForProject(form.projectId).map((te) => (
                  <MenuItem key={te.id} value={te.id}>
                    {te.code} — {te.testCaseCode} ({te.result})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Requirement"
                fullWidth
                disabled={!form.projectId}
                value={form.requirementId}
                onChange={(event) => setForm({ ...form, requirementId: event.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {requirementsForProject(form.projectId).map((req) => (
                  <MenuItem key={req.id} value={req.id}>
                    {req.code} — {req.title}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Assigned To"
                fullWidth
                value={form.assignedToId}
                onChange={(event) => setForm({ ...form, assignedToId: event.target.value })}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {activeUsers.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.fullName}
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
            <TextField
              label="Steps to Reproduce"
              fullWidth
              multiline
              minRows={2}
              value={form.stepsToReproduce}
              onChange={(event) => setForm({ ...form, stepsToReproduce: event.target.value })}
            />
            <TextField
              label="Resolution"
              fullWidth
              multiline
              minRows={2}
              value={form.resolution}
              onChange={(event) => setForm({ ...form, resolution: event.target.value })}
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
        <DialogTitle>Defect Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeDefect && (
            <>
              {[
                ['Code', activeDefect.code],
                ['Title', activeDefect.title],
                ['Project', `${activeDefect.projectName} (${activeDefect.projectCode})`],
                ['Severity', activeDefect.severity],
                ['Priority', activeDefect.priority],
                ['Status', activeDefect.status],
                ['Environment', activeDefect.environment || '—'],
                [
                  'Test Execution',
                  activeDefect.testExecutionCode
                    ? `${activeDefect.testExecutionCode} — ${activeDefect.testCaseCode} (${activeDefect.testExecutionResult})`
                    : '—',
                ],
                [
                  'Requirement',
                  activeDefect.requirementCode ? `${activeDefect.requirementCode} — ${activeDefect.requirementTitle}` : '—',
                ],
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
              {[
                ['Description', activeDefect.description],
                ['Steps to Reproduce', activeDefect.stepsToReproduce],
                ['Resolution', activeDefect.resolution],
              ].map(([label, value]) =>
                value ? (
                  <Box key={label} sx={{ py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'pre-line' }}>
                      {value}
                    </Typography>
                  </Box>
                ) : null,
              )}
              {[
                ['Reported By', activeDefect.reportedByName || '—'],
                ['Assigned To', activeDefect.assignedToName || '—'],
                ['Resolved By', activeDefect.resolvedByName || '—'],
                ['Resolved At', formatDateTime(activeDefect.resolvedAt)],
                ['Created', formatDateTime(activeDefect.createdAt)],
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
        <DialogTitle>Delete Defect</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {deleteError && <Alert severity="error">{deleteError}</Alert>}
          <Typography variant="body2">
            Delete <strong>{deleteTarget?.code}</strong>? This cannot be undone.
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
        title="Import Defects"
        importUrl="/defects/bulk-import"
        templateFilename="defects-template.csv"
        templateColumns={[
          'Title',
          'Code',
          'Severity',
          'Priority',
          'Status',
          'Description',
          'Steps To Reproduce',
          'Environment',
          'Requirement Code',
          'Assignee Email',
        ]}
        helperText="Title and Code are required. Requirement Code and Assignee Email are optional — both must match an existing requirement/user."
        projects={projects}
        defaultProjectId={projectFilter !== 'All' ? projectFilter : undefined}
        onImported={loadDefects}
      />
    </AppShell>
  );
}
