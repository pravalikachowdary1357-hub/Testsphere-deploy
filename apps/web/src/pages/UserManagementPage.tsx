import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { AppShell } from '../components/AppShell';
import { apiClient, extractErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { exportToCsv } from '../utils/exportCsv';

interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canDeactivate = currentUser?.permissions.includes('user:delete') ?? false;
  const canReactivate = currentUser?.permissions.includes('user:update') ?? false;

  const load = () => {
    setIsLoading(true);
    apiClient
      .get<UserSummary[]>('/users')
      .then(({ data }) => {
        setUsers(data);
        setError(null);
      })
      .catch((err) => setError(extractErrorMessage(err, 'Unable to load users.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleExport = () => {
    exportToCsv('users.csv', users, [
      { label: 'Name', value: (u) => u.fullName },
      { label: 'Email', value: (u) => u.email },
      { label: 'Status', value: (u) => (u.isActive ? 'Active' : 'Inactive') },
      { label: 'Created', value: (u) => formatDate(u.createdAt) },
    ]);
  };

  const deactivate = async (id: string) => {
    try {
      await apiClient.delete(`/users/${id}`);
      load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to deactivate this user.'));
    }
  };

  const reactivate = async (id: string) => {
    try {
      await apiClient.patch(`/users/${id}/reactivate`);
      load();
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to reactivate this user.'));
    }
  };

  return (
    <AppShell
      title="User Management"
      actions={
        <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
          Export
        </Button>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                {(canDeactivate || canReactivate) && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{u.fullName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip label={u.isActive ? 'Active' : 'Inactive'} size="small" color={u.isActive ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                    {(canDeactivate || canReactivate) && (
                      <TableCell align="right">
                        {canDeactivate && u.isActive && u.id !== currentUser?.id && (
                          <Tooltip title="Deactivate">
                            <IconButton size="small" color="error" onClick={() => deactivate(u.id)}>
                              <PersonOffOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canReactivate && !u.isActive && (
                          <Tooltip title="Reactivate">
                            <IconButton size="small" color="success" onClick={() => reactivate(u.id)}>
                              <PersonOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Box sx={{ mt: 2 }} />
    </AppShell>
  );
}
