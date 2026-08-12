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
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import { AppShell } from '../components/AppShell';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';
import { exportToCsv } from '../utils/exportCsv';

interface Product {
  id: string;
  name: string;
  code: string;
  description: string | null;
  version: string | null;
  status: string;
  createdAt: string;
  productOwnerId: string | null;
  productOwnerName: string | null;
  productOwnerEmail: string | null;
}

interface OrgUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
}

interface ProductFormState {
  name: string;
  code: string;
  description: string;
  version: string;
  status: string;
  productOwnerId: string;
}

const STATUS_OPTIONS = ['Active', 'Deprecated', 'Retired'];
const STATUS_FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];

const EMPTY_FORM: ProductFormState = {
  name: '',
  code: '',
  description: '',
  version: '',
  status: 'Active',
  productOwnerId: '',
};

function statusColor(status: string): 'success' | 'warning' | 'default' {
  if (status === 'Active') return 'success';
  if (status === 'Deprecated') return 'warning';
  return 'default';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type DialogMode = 'create' | 'edit' | 'view' | null;

export function ProductManagementPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const canCreate = user?.permissions.includes('product:create') ?? false;
  const canUpdate = user?.permissions.includes('product:update') ?? false;
  const canDelete = user?.permissions.includes('product:delete') ?? false;

  const loadProducts = () => {
    setIsLoading(true);
    apiClient
      .get<Product[]>('/products')
      .then(({ data }) => {
        setProducts(data);
        setLoadError(null);
      })
      .catch((error) => setLoadError(extractErrorMessage(error, 'Unable to load products.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProducts();
    apiClient
      .get<OrgUser[]>('/users')
      .then(({ data }) => setOrgUsers(data))
      .catch(() => undefined);
  }, []);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.status === 'Active').length,
      deprecated: products.filter((p) => p.status === 'Deprecated').length,
      retired: products.filter((p) => p.status === 'Retired').length,
    }),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        (p.productOwnerName ?? '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [products, searchTerm, statusFilter]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogMode('create');
  };

  const handleExport = () => {
    exportToCsv('products.csv', filteredProducts, [
      { label: 'Product Name', value: (p) => p.name },
      { label: 'Code', value: (p) => p.code },
      { label: 'Version', value: (p) => p.version },
      { label: 'Owner', value: (p) => p.productOwnerName },
      { label: 'Status', value: (p) => p.status },
      { label: 'Created Date', value: (p) => formatDate(p.createdAt) },
    ]);
  };

  const openEdit = (product: Product) => {
    setActiveProduct(product);
    setForm({
      name: product.name,
      code: product.code,
      description: product.description ?? '',
      version: product.version ?? '',
      status: product.status,
      productOwnerId: product.productOwnerId ?? '',
    });
    setFormError(null);
    setDialogMode('edit');
  };

  const openView = (product: Product) => {
    setActiveProduct(product);
    setDialogMode('view');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setActiveProduct(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim() || undefined,
      version: form.version.trim() || undefined,
      status: form.status,
      productOwnerId: form.productOwnerId || undefined,
    };

    try {
      if (dialogMode === 'create') {
        await apiClient.post('/products', payload);
        setToast('Product created');
      } else if (dialogMode === 'edit' && activeProduct) {
        await apiClient.put(`/products/${activeProduct.id}`, payload);
        setToast('Product updated');
      }
      closeDialog();
      loadProducts();
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Unable to save this product.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/products/${deleteTarget.id}`);
      setToast('Product deleted');
      setDeleteTarget(null);
      loadProducts();
    } catch (error) {
      setDeleteError(extractErrorMessage(error, 'Unable to delete this product.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell
      title="Product Management"
      actions={
        <>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
            Export
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Create Product
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
          { label: 'Total Products', value: stats.total, Icon: Inventory2OutlinedIcon },
          { label: 'Active', value: stats.active, Icon: CheckCircleOutlinedIcon },
          { label: 'Deprecated', value: stats.deprecated, Icon: WarningAmberOutlinedIcon },
          { label: 'Retired', value: stats.retired, Icon: ArchiveOutlinedIcon },
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
          placeholder="Search by name, code, or owner"
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
                <TableCell>Product Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created Date</TableCell>
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
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    {products.length === 0 ? 'No products yet.' : 'No products match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Inventory2OutlinedIcon sx={{ fontSize: 18, color: brand.teal }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {product.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.version || '—'}</TableCell>
                    <TableCell>{product.productOwnerName || '—'}</TableCell>
                    <TableCell>
                      <Chip label={product.status} size="small" color={statusColor(product.status)} />
                    </TableCell>
                    <TableCell>{formatDate(product.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(product)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(product)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(product)}>
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
        <DialogTitle>{dialogMode === 'create' ? 'Create Product' : 'Edit Product'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Product Name"
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
                label="Version"
                fullWidth
                placeholder="e.g. 1.2.0"
                value={form.version}
                onChange={(event) => setForm({ ...form, version: event.target.value })}
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
            <TextField
              select
              label="Product Owner"
              fullWidth
              value={form.productOwnerId}
              onChange={(event) => setForm({ ...form, productOwnerId: event.target.value })}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {orgUsers.map((orgUser) => (
                <MenuItem key={orgUser.id} value={orgUser.id}>
                  {orgUser.fullName}
                </MenuItem>
              ))}
            </TextField>
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
        <DialogTitle>Product Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeProduct && (
            <>
              {activeProduct.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {activeProduct.description}
                </Typography>
              )}
              {[
                ['Name', activeProduct.name],
                ['Code', activeProduct.code],
                ['Version', activeProduct.version || '—'],
                ['Status', activeProduct.status],
                ['Owner', activeProduct.productOwnerName || '—'],
                ['Owner Email', activeProduct.productOwnerEmail || '—'],
                ['Created', formatDate(activeProduct.createdAt)],
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
        <DialogTitle>Delete Product</DialogTitle>
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
