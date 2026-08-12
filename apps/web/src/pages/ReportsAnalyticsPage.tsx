import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
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
  Tooltip,
  Typography,
} from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { AppShell } from '../components/AppShell';
import { apiClient } from '../api/client';
import { brand } from '../theme/theme';
import { exportToCsv } from '../utils/exportCsv';

interface TraceabilityTestCase {
  testCaseId: string;
  testCaseCode: string;
  testCaseTitle: string;
  testCaseStatus: string;
  latestResult: string | null;
  defectCount: number;
}

interface TraceabilityRow {
  requirementId: string;
  requirementCode: string;
  requirementTitle: string;
  requirementStatus: string;
  requirementPriority: string;
  testCases: TraceabilityTestCase[];
}

interface QualityScore {
  score: number;
  verdict: 'Ready' | 'Conditional' | 'Not Ready';
  coverage: number;
  passRate: number | null;
  openCriticalDefects: number;
  totalRequirements: number;
  coveredRequirements: number;
}

interface ReportsSummary {
  qualityScore: QualityScore;
  traceability: TraceabilityRow[];
}

const RESULT_COLORS: Record<string, string> = {
  Pass: '#2e7d32',
  Fail: '#c62828',
  Blocked: brand.amberDark,
  Retest: '#0288d1',
  'Not Run': 'rgba(11,36,48,0.5)',
};

const VERDICT_COLORS: Record<string, { bg: string; color: string }> = {
  Ready: { bg: '#2e7d3222', color: '#2e7d32' },
  Conditional: { bg: `${brand.amber}22`, color: brand.amberDark },
  'Not Ready': { bg: '#c6282822', color: '#c62828' },
};

export function ReportsAnalyticsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<ReportsSummary>('/reports/summary')
      .then(({ data }) => setSummary(data))
      .catch(() => setLoadError('Unable to load reports.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleExport = () => {
    if (!summary) return;
    exportToCsv('traceability-matrix.csv', summary.traceability, [
      { label: 'Requirement Code', value: (r) => r.requirementCode },
      { label: 'Requirement Title', value: (r) => r.requirementTitle },
      { label: 'Status', value: (r) => r.requirementStatus },
      { label: 'Priority', value: (r) => r.requirementPriority },
      {
        label: 'Linked Test Cases',
        value: (r) => r.testCases.map((tc) => `${tc.testCaseCode} (${tc.latestResult ?? 'Not Run'})`).join('; '),
      },
    ]);
  };

  return (
    <AppShell
      title="Reports & Analytics"
      actions={
        summary && (
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
            Export
          </Button>
        )
      }
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : loadError || !summary ? (
        <Alert severity="error">{loadError ?? 'Unable to load reports.'}</Alert>
      ) : (
        <>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)', mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Release Quality Score
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    background: `conic-gradient(${brand.teal} 0% ${summary.qualityScore.score}%, rgba(11,36,48,0.08) ${summary.qualityScore.score}% 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 82,
                      height: 82,
                      borderRadius: '50%',
                      bgcolor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', color: brand.tealDark }}>
                      {summary.qualityScore.score}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Chip
                    label={summary.qualityScore.verdict}
                    sx={{
                      fontWeight: 700,
                      bgcolor: VERDICT_COLORS[summary.qualityScore.verdict].bg,
                      color: VERDICT_COLORS[summary.qualityScore.verdict].color,
                      mb: 1,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {summary.qualityScore.openCriticalDefects > 0
                      ? `${summary.qualityScore.openCriticalDefects} open critical defect${summary.qualityScore.openCriticalDefects === 1 ? '' : 's'} blocking Ready`
                      : 'No open critical defects'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, flex: 1, minWidth: 280 }}>
                {[
                  {
                    label: 'Coverage',
                    value: `${summary.qualityScore.coverage}%`,
                    sub: `${summary.qualityScore.coveredRequirements}/${summary.qualityScore.totalRequirements} requirements`,
                  },
                  {
                    label: 'Pass Rate',
                    value: summary.qualityScore.passRate != null ? `${summary.qualityScore.passRate}%` : '—',
                    sub: 'of executed cases',
                  },
                  {
                    label: 'Open Critical',
                    value: summary.qualityScore.openCriticalDefects,
                    sub: 'defects',
                  },
                ].map((metric) => (
                  <Box key={metric.label} sx={{ textAlign: 'center', py: 2, borderRadius: 2, bgcolor: 'rgba(11,36,48,0.03)' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: brand.tealDark }}>{metric.value}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                      {metric.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {metric.sub}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Traceability Matrix
          </Typography>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Requirement</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Linked Test Cases</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.traceability.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                        No requirements yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.traceability.map((row) => (
                      <TableRow key={row.requirementId} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.requirementCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.requirementTitle}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.requirementStatus}</TableCell>
                        <TableCell>
                          {row.testCases.length === 0 ? (
                            <Chip label="Not covered" size="small" sx={{ bgcolor: 'rgba(11,36,48,0.06)', color: 'text.secondary' }} />
                          ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                              {row.testCases.map((testCase) => {
                                const color = testCase.latestResult
                                  ? RESULT_COLORS[testCase.latestResult] ?? brand.teal
                                  : 'rgba(11,36,48,0.5)';
                                return (
                                  <Tooltip
                                    key={testCase.testCaseId}
                                    title={`${testCase.testCaseTitle}${testCase.defectCount > 0 ? ` · ${testCase.defectCount} defect${testCase.defectCount === 1 ? '' : 's'}` : ''}`}
                                  >
                                    <Chip
                                      label={`${testCase.testCaseCode}${testCase.latestResult ? ` · ${testCase.latestResult}` : ''}`}
                                      size="small"
                                      sx={{ fontWeight: 600, bgcolor: `${color}1f`, color }}
                                    />
                                  </Tooltip>
                                );
                              })}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </AppShell>
  );
}
