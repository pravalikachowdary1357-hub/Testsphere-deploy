import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { apiClient, extractErrorMessage } from '../api/client';
import { exportToCsv } from '../utils/exportCsv';
import { readCsvFile } from '../utils/importCsv';

export interface ImportProjectOption {
  id: string;
  name: string;
}

interface BulkImportResult {
  total: number;
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  importUrl: string;
  templateFilename: string;
  templateColumns: string[];
  helperText?: string;
  projects: ImportProjectOption[];
  defaultProjectId?: string;
  onImported: () => void;
}

export function ImportDialog({
  open,
  onClose,
  title,
  importUrl,
  templateFilename,
  templateColumns,
  helperText,
  projects,
  defaultProjectId,
  onImported,
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? '');
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const resetFile = () => {
    setFileName(null);
    setRows(null);
    setParseError(null);
    setResult(null);
    setSubmitError(null);
  };

  const handleClose = () => {
    resetFile();
    setProjectId(defaultProjectId ?? projects[0]?.id ?? '');
    onClose();
  };

  const downloadTemplate = () => {
    exportToCsv(
      templateFilename,
      [],
      templateColumns.map((column) => ({ label: column, value: () => '' })),
    );
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    resetFile();
    setFileName(file.name);
    try {
      const parsed = await readCsvFile(file);
      if (parsed.rows.length === 0) {
        setParseError('No data rows found in this file.');
        return;
      }
      setRows(parsed.rows);
    } catch {
      setParseError('Unable to read this file. Make sure it is a valid CSV.');
    }
  };

  const handleSubmit = async () => {
    if (!rows || !projectId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await apiClient.post<BulkImportResult>(importUrl, { projectId, rows });
      setResult(data);
      onImported();
    } catch (error) {
      setSubmitError(extractErrorMessage(error, 'Unable to import this file.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        {helperText && (
          <Typography variant="body2" color="text.secondary">
            {helperText}
          </Typography>
        )}

        <Button variant="text" startIcon={<DownloadOutlinedIcon />} onClick={downloadTemplate} sx={{ alignSelf: 'flex-start' }}>
          Download CSV template
        </Button>

        <TextField
          select
          label="Project"
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
          disabled={projects.length === 0}
          helperText={projects.length === 0 ? 'No projects available.' : 'Rows are imported into this project.'}
        >
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </TextField>

        <Box>
          <Button variant="outlined" startIcon={<UploadFileOutlinedIcon />} onClick={() => fileInputRef.current?.click()}>
            Choose CSV file
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" hidden onChange={handleFileChange} />
          {fileName && (
            <Typography variant="body2" sx={{ mt: 1 }} color={parseError ? 'error' : 'text.secondary'}>
              {parseError ?? `${fileName} — ${rows?.length ?? 0} row(s) detected`}
            </Typography>
          )}
        </Box>

        {submitError && <Alert severity="error">{submitError}</Alert>}

        {result && (
          <>
            <Alert severity={result.failed === 0 ? 'success' : result.created === 0 ? 'error' : 'warning'}>
              {result.created} of {result.total} row(s) imported
              {result.failed > 0 ? `, ${result.failed} failed` : ''}.
            </Alert>
            {result.errors.length > 0 && (
              <TableContainer sx={{ maxHeight: 220, border: '1px solid rgba(11,36,48,0.08)', borderRadius: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell width={80}>Row</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.errors.map((rowError) => (
                      <TableRow key={rowError.row}>
                        <TableCell>{rowError.row}</TableCell>
                        <TableCell>{rowError.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose}>{result ? 'Done' : 'Cancel'}</Button>
        {!result && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!rows || !projectId || isSubmitting || Boolean(parseError)}
          >
            {isSubmitting ? 'Importing…' : 'Import'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
