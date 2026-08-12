import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { AppShell } from '../components/AppShell';
import { apiClient, extractErrorMessage } from '../api/client';
import { exportToCsv } from '../utils/exportCsv';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  user: { fullName: string; email: string } | null;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<AuditLogEntry[]>('/audit-logs', { params: { limit: 50 } })
      .then(({ data }) => {
        setLogs(data);
        setError(null);
      })
      .catch((err) => setError(extractErrorMessage(err, 'Unable to load the audit log.')))
      .finally(() => setIsLoading(false));
  }, []);

  const handleExport = () => {
    exportToCsv('audit-logs.csv', logs, [
      { label: 'Action', value: (log) => log.action.replace(/_/g, ' ') },
      { label: 'Entity', value: (log) => `${log.entityType}${log.entityId ? ` (${log.entityId})` : ''}` },
      { label: 'Actor', value: (log) => (log.user ? `${log.user.fullName} (${log.user.email})` : 'System') },
      { label: 'When', value: (log) => formatTimestamp(log.createdAt) },
    ]);
  };

  return (
    <AppShell
      title="Audit Logs"
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>When</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No activity recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Chip label={log.action.replace(/_/g, ' ')} size="small" sx={{ fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ''}
                    </TableCell>
                    <TableCell>{log.user ? `${log.user.fullName} (${log.user.email})` : 'System'}</TableCell>
                    <TableCell>{formatTimestamp(log.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </AppShell>
  );
}
