import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Autocomplete,
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
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import { AppShell } from '../components/AppShell';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';

interface TestCaseSummary {
  id: string;
  title: string;
  code: string;
  status: string;
}

interface TestSuite {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: string;
  status: string;
  createdAt: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  createdByName: string | null;
  testCaseCount: number;
  testCases: TestCaseSummary[];
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

interface TestSuiteFormState {
  name: string;
  code: string;
  projectId: string;
  type: string;
  status: string;
  description: string;
  testCaseIds: string[];
}

const TYPE_OPTIONS = ['Regression', 'Smoke', 'Sanity', 'Release', 'Full'];
const STATUS_OPTIONS = ['Draft', 'Active', 'Archived'];
const STATUS_FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];

const EMPTY_FORM: TestSuiteFormState = {
  name: '',
  code: '',
  projectId: '',
  type: 'Regression',
  status: 'Draft',
  description: '',
  testCaseIds: [],
};

function statusColor(status: string): 'success' | 'default' | 'secondary' {
  if (status === 'Active') return 'success';
  if (status === 'Archived') return 'secondary';
  return 'default';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type DialogMode = 'create' | 'edit' | 'view' | null;

export function TestSuiteManagementPage() {
  const { user } = useAuth();
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [testCaseOptions, setTestCaseOptions] = useState<TestCaseOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeTestSuite, setActiveTestSuite] = useState<TestSuite | null>(null);
  const [form, setForm] = useState<TestSuiteFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TestSuite | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');

  const canCreate = user?.permissions.includes('testsuite:create') ?? false;
  const canUpdate = user?.permissions.includes('testsuite:update') ?? false;
  const canDelete = user?.permissions.includes('testsuite:delete') ?? false;

  const loadTestSuites = () => {
    setIsLoading(true);
    apiClient
      .get<TestSuite[]>('/test-suites')
      .then(({ data }) => {
        setTestSuites(data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load test suites.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTestSuites();
    apiClient
      .get<ProjectOption[]>('/projects')
      .then(({ data }) => setProjects(data))
      .catch(() => undefined);
    apiClient
      .get<TestCaseOption[]>('/test-cases')
      .then(({ data }) => setTestCaseOptions(data))
      .catch(() => undefined);
  }, []);

  const stats = useMemo(
    () => ({
      total: testSuites.length,
      active: testSuites.filter((s) => s.status === 'Active').length,
      draft: testSuites.filter((s) => s.status === 'Draft').length,
      archived: testSuites.filter((s) => s.status === 'Archived').length,
    }),
    [testSuites],
  );

  const filteredTestSuites = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return testSuites.filter((s) => {
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesProject = projectFilter === 'All' || s.projectId === projectFilter;
      const matchesSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        s.projectName.toLowerCase().includes(term);
      return matchesStatus && matchesProject && matchesSearch;
    });
  }, [testSuites, searchTerm, statusFilter, projectFilter]);

  const testCasesForProject = (projectId: string) => testCaseOptions.filter((tc) => tc.projectId === projectId);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?.id ?? '' });
    setFormError(null);
    setDialogMode('create');
  };

  const openEdit = (testSuite: TestSuite) => {
    setActiveTestSuite(testSuite);
    setForm({
      name: testSuite.name,
      code: testSuite.code,
      projectId: testSuite.projectId,
      type: testSuite.type,
      status: testSuite.status,
      description: testSuite.description ?? '',
      testCaseIds: testSuite.testCases.map((tc) => tc.id),
    });
    setFormError(null);
    setDialogMode('edit');
  };

  const openView = (testSuite: TestSuite) => {
    setActiveTestSuite(testSuite);
    setDialogMode('view');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setActiveTestSuite(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      projectId: form.projectId,
      type: form.type,
      status: form.status,
      description: form.description.trim() || undefined,
      testCaseIds: form.testCaseIds,
    };

    try {
      if (dialogMode === 'create') {
        await apiClient.post('/test-suites', payload);
        setToast('Test suite created');
      } else if (dialogMode === 'edit' && activeTestSuite) {
        await apiClient.put(`/test-suites/${activeTestSuite.id}`, payload);
        setToast('Test suite updated');
      }
      closeDialog();
      loadTestSuites();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to save this test suite.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/test-suites/${deleteTarget.id}`);
      setToast('Test suite deleted');
      setDeleteTarget(null);
      loadTestSuites();
    } catch (error) {
      setDeleteError(extractErrorMessage(error, 'Unable to delete this test suite.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedTestCaseOptions = testCasesForProject(form.projectId).filter((tc) => form.testCaseIds.includes(tc.id));

  return (
    <AppShell title="Test Suite Management">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: 'Total Test Suites', value: stats.total, Icon: LayersOutlinedIcon },
          { label: 'Active', value: stats.active, Icon: CheckCircleOutlinedIcon },
          { label: 'Draft', value: stats.draft, Icon: EditNoteOutlinedIcon },
          { label: 'Archived', value: stats.archived, Icon: InventoryOutlinedIcon },
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
            placeholder="Search by name, code, or project"
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
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={projects.length === 0}>
            Create Test Suite
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
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Test Cases</TableCell>
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
              ) : filteredTestSuites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    {testSuites.length === 0 ? 'No test suites yet.' : 'No test suites match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTestSuites.map((testSuite) => (
                  <TableRow key={testSuite.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <LayersOutlinedIcon sx={{ fontSize: 18, color: brand.teal }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {testSuite.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{testSuite.code}</TableCell>
                    <TableCell>{testSuite.projectName}</TableCell>
                    <TableCell>{testSuite.type}</TableCell>
                    <TableCell>
                      <Chip label={testSuite.status} size="small" color={statusColor(testSuite.status)} />
                    </TableCell>
                    <TableCell>{testSuite.testCaseCount}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(testSuite)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(testSuite)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(testSuite)}>
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
        <DialogTitle>{dialogMode === 'create' ? 'Create Test Suite' : 'Edit Test Suite'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Name"
              required
              fullWidth
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
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
                onChange={(event) => setForm({ ...form, projectId: event.target.value, testCaseIds: [] })}
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
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={testCasesForProject(form.projectId)}
              value={selectedTestCaseOptions}
              getOptionLabel={(option) => `${option.code} — ${option.title}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, newValue) => setForm({ ...form, testCaseIds: newValue.map((v) => v.id) })}
              disabled={!form.projectId}
              renderValue={(value, getItemProps) =>
                value.map((option, index) => (
                  <Chip label={option.code} size="small" {...getItemProps({ index })} key={option.id} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Test Cases"
                  placeholder="Search test cases in this project"
                  helperText={!form.projectId ? 'Choose a project first' : 'Cases included in this suite'}
                />
              )}
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
        <DialogTitle>Test Suite Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeTestSuite && (
            <>
              {activeTestSuite.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {activeTestSuite.description}
                </Typography>
              )}
              {[
                ['Name', activeTestSuite.name],
                ['Code', activeTestSuite.code],
                ['Project', `${activeTestSuite.projectName} (${activeTestSuite.projectCode})`],
                ['Type', activeTestSuite.type],
                ['Status', activeTestSuite.status],
                ['Created By', activeTestSuite.createdByName || '—'],
                ['Created', formatDate(activeTestSuite.createdAt)],
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
              <Box sx={{ py: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                  Test Cases ({activeTestSuite.testCaseCount})
                </Typography>
                {activeTestSuite.testCases.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No test cases in this suite yet.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {activeTestSuite.testCases.map((tc) => (
                      <Chip key={tc.id} label={`${tc.code} — ${tc.title}`} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Test Suite</DialogTitle>
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
