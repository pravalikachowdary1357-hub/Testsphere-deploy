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
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import { AppShell } from '../components/AppShell';
import { ImportDialog } from '../components/ImportDialog';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';
import { exportToCsv } from '../utils/exportCsv';

interface TestCase {
  id: string;
  title: string;
  code: string;
  description: string | null;
  preconditions: string | null;
  steps: string | null;
  expectedResult: string | null;
  testData: string | null;
  type: string;
  priority: string;
  risk: string;
  tags: string | null;
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

interface TestCaseFormState {
  title: string;
  code: string;
  projectId: string;
  type: string;
  priority: string;
  risk: string;
  status: string;
  description: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
  testData: string;
  tags: string;
}

const TYPE_OPTIONS = ['Functional', 'Regression', 'Smoke', 'Integration', 'Performance', 'Security', 'Usability'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
const RISK_OPTIONS = ['High', 'Medium', 'Low'];
const STATUS_OPTIONS = ['Draft', 'Ready for Review', 'Approved', 'Deprecated'];
const STATUS_FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];

const EMPTY_FORM: TestCaseFormState = {
  title: '',
  code: '',
  projectId: '',
  type: 'Functional',
  priority: 'Medium',
  risk: 'Medium',
  status: 'Draft',
  description: '',
  preconditions: '',
  steps: '',
  expectedResult: '',
  testData: '',
  tags: '',
};

function statusColor(status: string): 'success' | 'warning' | 'secondary' | 'default' {
  if (status === 'Approved') return 'success';
  if (status === 'Ready for Review') return 'warning';
  if (status === 'Deprecated') return 'secondary';
  return 'default';
}

function priorityColor(priority: string): 'error' | 'warning' | 'info' | 'default' {
  if (priority === 'Critical') return 'error';
  if (priority === 'High') return 'warning';
  if (priority === 'Medium') return 'info';
  return 'default';
}

function riskColor(risk: string): 'error' | 'warning' | 'success' {
  if (risk === 'High') return 'error';
  if (risk === 'Medium') return 'warning';
  return 'success';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type DialogMode = 'create' | 'edit' | 'view' | null;

export function TestCaseManagementPage() {
  const { user } = useAuth();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeTestCase, setActiveTestCase] = useState<TestCase | null>(null);
  const [form, setForm] = useState<TestCaseFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TestCase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');

  const canCreate = user?.permissions.includes('testcase:create') ?? false;
  const canUpdate = user?.permissions.includes('testcase:update') ?? false;
  const canDelete = user?.permissions.includes('testcase:delete') ?? false;

  const loadTestCases = () => {
    setIsLoading(true);
    apiClient
      .get<TestCase[]>('/test-cases')
      .then(({ data }) => {
        setTestCases(data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load test cases.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTestCases();
    apiClient
      .get<ProjectOption[]>('/projects')
      .then(({ data }) => setProjects(data))
      .catch(() => undefined);
  }, []);

  const stats = useMemo(
    () => ({
      total: testCases.length,
      approved: testCases.filter((tc) => tc.status === 'Approved').length,
      readyForReview: testCases.filter((tc) => tc.status === 'Ready for Review').length,
      draft: testCases.filter((tc) => tc.status === 'Draft').length,
    }),
    [testCases],
  );

  const filteredTestCases = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return testCases.filter((tc) => {
      const matchesStatus = statusFilter === 'All' || tc.status === statusFilter;
      const matchesProject = projectFilter === 'All' || tc.projectId === projectFilter;
      const matchesSearch =
        !term ||
        tc.title.toLowerCase().includes(term) ||
        tc.code.toLowerCase().includes(term) ||
        tc.projectName.toLowerCase().includes(term);
      return matchesStatus && matchesProject && matchesSearch;
    });
  }, [testCases, searchTerm, statusFilter, projectFilter]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?.id ?? '' });
    setFormError(null);
    setDialogMode('create');
  };

  const handleExport = () => {
    exportToCsv('test-cases.csv', filteredTestCases, [
      { label: 'Title', value: (tc) => tc.title },
      { label: 'Code', value: (tc) => tc.code },
      { label: 'Project', value: (tc) => tc.projectName },
      { label: 'Type', value: (tc) => tc.type },
      { label: 'Priority', value: (tc) => tc.priority },
      { label: 'Risk', value: (tc) => tc.risk },
      { label: 'Status', value: (tc) => tc.status },
      { label: 'Version', value: (tc) => tc.version },
    ]);
  };

  const openEdit = (testCase: TestCase) => {
    setActiveTestCase(testCase);
    setForm({
      title: testCase.title,
      code: testCase.code,
      projectId: testCase.projectId,
      type: testCase.type,
      priority: testCase.priority,
      risk: testCase.risk,
      status: testCase.status,
      description: testCase.description ?? '',
      preconditions: testCase.preconditions ?? '',
      steps: testCase.steps ?? '',
      expectedResult: testCase.expectedResult ?? '',
      testData: testCase.testData ?? '',
      tags: testCase.tags ?? '',
    });
    setFormError(null);
    setDialogMode('edit');
  };

  const openView = (testCase: TestCase) => {
    setActiveTestCase(testCase);
    setDialogMode('view');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setActiveTestCase(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = {
      title: form.title.trim(),
      code: form.code.trim(),
      projectId: form.projectId,
      type: form.type,
      priority: form.priority,
      risk: form.risk,
      status: form.status,
      description: form.description.trim() || undefined,
      preconditions: form.preconditions.trim() || undefined,
      steps: form.steps.trim() || undefined,
      expectedResult: form.expectedResult.trim() || undefined,
      testData: form.testData.trim() || undefined,
      tags: form.tags.trim() || undefined,
    };

    try {
      if (dialogMode === 'create') {
        await apiClient.post('/test-cases', payload);
        setToast('Test case created');
      } else if (dialogMode === 'edit' && activeTestCase) {
        await apiClient.put(`/test-cases/${activeTestCase.id}`, payload);
        setToast('Test case updated');
      }
      closeDialog();
      loadTestCases();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to save this test case.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/test-cases/${deleteTarget.id}`);
      setToast('Test case deleted');
      setDeleteTarget(null);
      loadTestCases();
    } catch (error) {
      setDeleteError(extractErrorMessage(error, 'Unable to delete this test case.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell
      title="Test Case Management"
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
              Create Test Case
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
          { label: 'Total Test Cases', value: stats.total, Icon: ChecklistOutlinedIcon },
          { label: 'Approved', value: stats.approved, Icon: CheckCircleOutlinedIcon },
          { label: 'Ready for Review', value: stats.readyForReview, Icon: RateReviewOutlinedIcon },
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
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Version</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : filteredTestCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    {testCases.length === 0 ? 'No test cases yet.' : 'No test cases match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTestCases.map((testCase) => (
                  <TableRow key={testCase.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <ChecklistOutlinedIcon sx={{ fontSize: 18, color: brand.teal }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {testCase.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{testCase.code}</TableCell>
                    <TableCell>{testCase.projectName}</TableCell>
                    <TableCell>{testCase.type}</TableCell>
                    <TableCell>
                      <Chip label={testCase.priority} size="small" color={priorityColor(testCase.priority)} />
                    </TableCell>
                    <TableCell>
                      <Chip label={testCase.risk} size="small" color={riskColor(testCase.risk)} />
                    </TableCell>
                    <TableCell>
                      <Chip label={testCase.status} size="small" color={statusColor(testCase.status)} />
                    </TableCell>
                    <TableCell>v{testCase.version}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(testCase)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(testCase)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(testCase)}>
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
        <DialogTitle>{dialogMode === 'create' ? 'Create Test Case' : 'Edit Test Case'}</DialogTitle>
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
            </Box>
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
                label="Risk"
                fullWidth
                value={form.risk}
                onChange={(event) => setForm({ ...form, risk: event.target.value })}
              >
                {RISK_OPTIONS.map((option) => (
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
                label="Preconditions"
                fullWidth
                multiline
                minRows={2}
                value={form.preconditions}
                onChange={(event) => setForm({ ...form, preconditions: event.target.value })}
              />
              <TextField
                label="Expected Result"
                fullWidth
                multiline
                minRows={2}
                value={form.expectedResult}
                onChange={(event) => setForm({ ...form, expectedResult: event.target.value })}
              />
            </Box>
            <TextField
              label="Steps"
              fullWidth
              multiline
              minRows={3}
              helperText="One step per line"
              value={form.steps}
              onChange={(event) => setForm({ ...form, steps: event.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Test Data"
                fullWidth
                value={form.testData}
                onChange={(event) => setForm({ ...form, testData: event.target.value })}
              />
              <TextField
                label="Tags"
                fullWidth
                placeholder="e.g. auth, regression"
                helperText="Comma-separated"
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
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
        <DialogTitle>Test Case Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeTestCase && (
            <>
              {activeTestCase.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {activeTestCase.description}
                </Typography>
              )}
              {[
                ['Title', activeTestCase.title],
                ['Code', activeTestCase.code],
                ['Project', `${activeTestCase.projectName} (${activeTestCase.projectCode})`],
                ['Type', activeTestCase.type],
                ['Priority', activeTestCase.priority],
                ['Risk', activeTestCase.risk],
                ['Status', activeTestCase.status],
                ['Version', `v${activeTestCase.version}`],
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
                ['Preconditions', activeTestCase.preconditions],
                ['Steps', activeTestCase.steps],
                ['Expected Result', activeTestCase.expectedResult],
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
                ['Test Data', activeTestCase.testData || '—'],
                ['Tags', activeTestCase.tags || '—'],
                ['Created By', activeTestCase.createdByName || '—'],
                ['Approved By', activeTestCase.approvedByName || '—'],
                ['Approved At', formatDate(activeTestCase.approvedAt)],
                ['Created', formatDate(activeTestCase.createdAt)],
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
        <DialogTitle>Delete Test Case</DialogTitle>
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
        title="Import Test Cases"
        importUrl="/test-cases/bulk-import"
        templateFilename="test-cases-template.csv"
        templateColumns={[
          'Title',
          'Code',
          'Type',
          'Priority',
          'Risk',
          'Status',
          'Description',
          'Preconditions',
          'Steps',
          'Expected Result',
          'Test Data',
          'Tags',
          'Requirement Code',
        ]}
        helperText="Title and Code are required. Requirement Code is optional — set it to link a row to an existing requirement in this project."
        projects={projects}
        defaultProjectId={projectFilter !== 'All' ? projectFilter : undefined}
        onImported={loadTestCases}
      />
    </AppShell>
  );
}
