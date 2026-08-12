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
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import { AppShell } from '../components/AppShell';
import { ImportDialog } from '../components/ImportDialog';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';
import { exportToCsv } from '../utils/exportCsv';

interface TestExecution {
  id: string;
  code: string;
  cycle: string | null;
  result: string;
  actualResult: string | null;
  notes: string | null;
  environment: string | null;
  executedAt: string | null;
  createdAt: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  testCaseId: string;
  testCaseTitle: string;
  testCaseCode: string;
  testPlanId: string | null;
  testPlanTitle: string | null;
  testPlanCode: string | null;
  testSuiteId: string | null;
  testSuiteName: string | null;
  testSuiteCode: string | null;
  executedByName: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
  code: string;
}

interface TestCaseOption {
  id: string;
  title: string;
  code: string;
  projectId: string;
}

interface TestPlanOption {
  id: string;
  title: string;
  code: string;
  projectId: string;
}

interface TestSuiteOption {
  id: string;
  name: string;
  code: string;
  projectId: string;
}

interface TestExecutionFormState {
  code: string;
  projectId: string;
  testCaseId: string;
  testPlanId: string;
  testSuiteId: string;
  cycle: string;
  result: string;
  environment: string;
  actualResult: string;
  notes: string;
}

const RESULT_OPTIONS = ['Not Run', 'Pass', 'Fail', 'Blocked', 'Retest'];
const RESULT_FILTER_OPTIONS = ['All', ...RESULT_OPTIONS];

const EMPTY_FORM: TestExecutionFormState = {
  code: '',
  projectId: '',
  testCaseId: '',
  testPlanId: '',
  testSuiteId: '',
  cycle: '',
  result: 'Not Run',
  environment: '',
  actualResult: '',
  notes: '',
};

function resultColor(result: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  if (result === 'Pass') return 'success';
  if (result === 'Fail') return 'error';
  if (result === 'Blocked') return 'warning';
  if (result === 'Retest') return 'info';
  return 'default';
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

type DialogMode = 'create' | 'edit' | 'view' | null;

export function TestExecutionManagementPage() {
  const { user } = useAuth();
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [testCaseOptions, setTestCaseOptions] = useState<TestCaseOption[]>([]);
  const [testPlanOptions, setTestPlanOptions] = useState<TestPlanOption[]>([]);
  const [testSuiteOptions, setTestSuiteOptions] = useState<TestSuiteOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeExecution, setActiveExecution] = useState<TestExecution | null>(null);
  const [form, setForm] = useState<TestExecutionFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TestExecution | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');

  const canCreate = user?.permissions.includes('testexecution:create') ?? false;
  const canUpdate = user?.permissions.includes('testexecution:update') ?? false;
  const canDelete = user?.permissions.includes('testexecution:delete') ?? false;

  const loadExecutions = () => {
    setIsLoading(true);
    apiClient
      .get<TestExecution[]>('/test-executions')
      .then(({ data }) => {
        setExecutions(data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load test executions.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadExecutions();
    apiClient.get<ProjectOption[]>('/projects').then(({ data }) => setProjects(data)).catch(() => undefined);
    apiClient.get<TestCaseOption[]>('/test-cases').then(({ data }) => setTestCaseOptions(data)).catch(() => undefined);
    apiClient.get<TestPlanOption[]>('/test-plans').then(({ data }) => setTestPlanOptions(data)).catch(() => undefined);
    apiClient.get<TestSuiteOption[]>('/test-suites').then(({ data }) => setTestSuiteOptions(data)).catch(() => undefined);
  }, []);

  const stats = useMemo(
    () => ({
      total: executions.length,
      pass: executions.filter((e) => e.result === 'Pass').length,
      fail: executions.filter((e) => e.result === 'Fail').length,
      notRun: executions.filter((e) => e.result === 'Not Run').length,
    }),
    [executions],
  );

  const filteredExecutions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return executions.filter((e) => {
      const matchesResult = resultFilter === 'All' || e.result === resultFilter;
      const matchesProject = projectFilter === 'All' || e.projectId === projectFilter;
      const matchesSearch =
        !term ||
        e.code.toLowerCase().includes(term) ||
        e.testCaseTitle.toLowerCase().includes(term) ||
        (e.cycle ?? '').toLowerCase().includes(term);
      return matchesResult && matchesProject && matchesSearch;
    });
  }, [executions, searchTerm, resultFilter, projectFilter]);

  const testCasesForProject = (projectId: string) => testCaseOptions.filter((tc) => tc.projectId === projectId);
  const testPlansForProject = (projectId: string) => testPlanOptions.filter((tp) => tp.projectId === projectId);
  const testSuitesForProject = (projectId: string) => testSuiteOptions.filter((ts) => ts.projectId === projectId);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?.id ?? '' });
    setFormError(null);
    setDialogMode('create');
  };

  const handleExport = () => {
    exportToCsv('test-executions.csv', filteredExecutions, [
      { label: 'Code', value: (e) => e.code },
      { label: 'Test Case', value: (e) => e.testCaseTitle },
      { label: 'Project', value: (e) => e.projectName },
      { label: 'Cycle', value: (e) => e.cycle },
      { label: 'Result', value: (e) => e.result },
      { label: 'Executed By', value: (e) => e.executedByName },
      { label: 'Executed At', value: (e) => formatDateTime(e.executedAt) },
    ]);
  };

  const openEdit = (execution: TestExecution) => {
    setActiveExecution(execution);
    setForm({
      code: execution.code,
      projectId: execution.projectId,
      testCaseId: execution.testCaseId,
      testPlanId: execution.testPlanId ?? '',
      testSuiteId: execution.testSuiteId ?? '',
      cycle: execution.cycle ?? '',
      result: execution.result,
      environment: execution.environment ?? '',
      actualResult: execution.actualResult ?? '',
      notes: execution.notes ?? '',
    });
    setFormError(null);
    setDialogMode('edit');
  };

  const openView = (execution: TestExecution) => {
    setActiveExecution(execution);
    setDialogMode('view');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setActiveExecution(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = {
      code: form.code.trim(),
      projectId: form.projectId,
      testCaseId: form.testCaseId,
      testPlanId: form.testPlanId || undefined,
      testSuiteId: form.testSuiteId || undefined,
      cycle: form.cycle.trim() || undefined,
      result: form.result,
      environment: form.environment.trim() || undefined,
      actualResult: form.actualResult.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (dialogMode === 'create') {
        await apiClient.post('/test-executions', payload);
        setToast('Test execution recorded');
      } else if (dialogMode === 'edit' && activeExecution) {
        await apiClient.put(`/test-executions/${activeExecution.id}`, payload);
        setToast('Test execution updated');
      }
      closeDialog();
      loadExecutions();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to save this test execution.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/test-executions/${deleteTarget.id}`);
      setToast('Test execution deleted');
      setDeleteTarget(null);
      loadExecutions();
    } catch (error) {
      setDeleteError(extractErrorMessage(error, 'Unable to delete this test execution.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell
      title="Test Execution"
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
              Record Execution
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
          { label: 'Total Executions', value: stats.total, Icon: PlayCircleOutlineOutlinedIcon },
          { label: 'Pass', value: stats.pass, Icon: CheckCircleOutlinedIcon },
          { label: 'Fail', value: stats.fail, Icon: ErrorOutlineOutlinedIcon },
          { label: 'Not Run', value: stats.notRun, Icon: HourglassEmptyOutlinedIcon },
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
          placeholder="Search by code, test case, or cycle"
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
          label="Result"
          value={resultFilter}
          onChange={(event) => setResultFilter(event.target.value)}
          sx={{ minWidth: 150 }}
        >
          {RESULT_FILTER_OPTIONS.map((option) => (
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
                <TableCell>Test Case</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Cycle</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Executed By</TableCell>
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
              ) : filteredExecutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    {executions.length === 0 ? 'No test executions yet.' : 'No test executions match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExecutions.map((execution) => (
                  <TableRow key={execution.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <PlayCircleOutlineOutlinedIcon sx={{ fontSize: 18, color: brand.teal }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {execution.code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{execution.testCaseCode} — {execution.testCaseTitle}</TableCell>
                    <TableCell>{execution.projectName}</TableCell>
                    <TableCell>{execution.cycle || '—'}</TableCell>
                    <TableCell>
                      <Chip label={execution.result} size="small" color={resultColor(execution.result)} />
                    </TableCell>
                    <TableCell>{execution.executedByName || '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(execution)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(execution)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(execution)}>
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
        <DialogTitle>{dialogMode === 'create' ? 'Record Test Execution' : 'Edit Test Execution'}</DialogTitle>
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
                onChange={(event) => setForm({ ...form, projectId: event.target.value, testCaseId: '', testPlanId: '', testSuiteId: '' })}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Test Case"
                required
                fullWidth
                disabled={!form.projectId}
                value={form.testCaseId}
                onChange={(event) => setForm({ ...form, testCaseId: event.target.value })}
              >
                {testCasesForProject(form.projectId).map((tc) => (
                  <MenuItem key={tc.id} value={tc.id}>
                    {tc.code} — {tc.title}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Test Plan"
                fullWidth
                disabled={!form.projectId}
                value={form.testPlanId}
                onChange={(event) => setForm({ ...form, testPlanId: event.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {testPlansForProject(form.projectId).map((tp) => (
                  <MenuItem key={tp.id} value={tp.id}>
                    {tp.code} — {tp.title}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Test Suite"
                fullWidth
                disabled={!form.projectId}
                value={form.testSuiteId}
                onChange={(event) => setForm({ ...form, testSuiteId: event.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {testSuitesForProject(form.projectId).map((ts) => (
                  <MenuItem key={ts.id} value={ts.id}>
                    {ts.code} — {ts.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Cycle"
                fullWidth
                placeholder="e.g. Cycle 12 · Sprint 24"
                value={form.cycle}
                onChange={(event) => setForm({ ...form, cycle: event.target.value })}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Result"
                fullWidth
                value={form.result}
                onChange={(event) => setForm({ ...form, result: event.target.value })}
              >
                {RESULT_OPTIONS.map((option) => (
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
            <TextField
              label="Actual Result"
              fullWidth
              multiline
              minRows={2}
              value={form.actualResult}
              onChange={(event) => setForm({ ...form, actualResult: event.target.value })}
            />
            <TextField
              label="Notes"
              fullWidth
              multiline
              minRows={2}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
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
        <DialogTitle>Test Execution Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeExecution && (
            <>
              {[
                ['Code', activeExecution.code],
                ['Test Case', `${activeExecution.testCaseCode} — ${activeExecution.testCaseTitle}`],
                ['Project', `${activeExecution.projectName} (${activeExecution.projectCode})`],
                ['Test Plan', activeExecution.testPlanTitle ? `${activeExecution.testPlanCode} — ${activeExecution.testPlanTitle}` : '—'],
                ['Test Suite', activeExecution.testSuiteName ? `${activeExecution.testSuiteCode} — ${activeExecution.testSuiteName}` : '—'],
                ['Cycle', activeExecution.cycle || '—'],
                ['Result', activeExecution.result],
                ['Environment', activeExecution.environment || '—'],
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
                ['Actual Result', activeExecution.actualResult],
                ['Notes', activeExecution.notes],
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
                ['Executed By', activeExecution.executedByName || '—'],
                ['Executed At', formatDateTime(activeExecution.executedAt)],
                ['Created', formatDateTime(activeExecution.createdAt)],
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
        <DialogTitle>Delete Test Execution</DialogTitle>
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
        title="Import Test Executions"
        importUrl="/test-executions/bulk-import"
        templateFilename="test-executions-template.csv"
        templateColumns={['Code', 'Test Case Code', 'Cycle', 'Result', 'Actual Result', 'Notes', 'Environment', 'Executed At']}
        helperText="Code and Test Case Code are required — Test Case Code must match an existing test case's code in this project."
        projects={projects}
        defaultProjectId={projectFilter !== 'All' ? projectFilter : undefined}
        onImported={loadExecutions}
      />
    </AppShell>
  );
}
