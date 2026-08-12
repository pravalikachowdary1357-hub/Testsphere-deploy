import { useEffect, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import DonutLargeOutlinedIcon from '@mui/icons-material/DonutLargeOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import type SvgIcon from '@mui/material/SvgIcon';
import { AppShell } from '../components/AppShell';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';

interface DashboardSummary {
  totalOrganizations: number | null;
  totalUsers: number;
  totalProjects: number;
  totalProducts: number;
  totalRequirements: number;
  totalTestPlans: number;
  totalTestCases: number;
  totalTestSuites: number;
  totalTestExecutions: number;
  passRate: number | null;
  failedTests: number;
  pendingTests: number;
  testingStatus: { pass: number; fail: number; blocked: number; notRun: number } | null;
  latestExecution: {
    code: string;
    result: string;
    testCaseTitle: string;
    testCaseCode: string;
    executedByName: string | null;
    executedAt: string | null;
  } | null;
  totalDefects: number;
  defectTrend: Array<{ date: string; label: string; count: number }>;
  scope: 'system' | 'organization';
  usersByRole: Array<{ role: string; count: number }>;
  organizationsByStatus: Array<{ status: string; count: number }> | null;
  loginActivity: Array<{ date: string; label: string; count: number }> | null;
}

interface AuditLogEntry {
  id: string;
  action: string;
  createdAt: string;
  user: { fullName: string; email: string } | null;
}

type NumericMetricKey =
  | 'totalOrganizations'
  | 'totalUsers'
  | 'totalProjects'
  | 'totalProducts'
  | 'totalRequirements'
  | 'totalTestPlans'
  | 'totalTestCases'
  | 'totalTestSuites'
  | 'totalTestExecutions'
  | 'passRate'
  | 'failedTests'
  | 'pendingTests'
  | 'totalDefects';

interface MetricDef {
  key: NumericMetricKey | string;
  label: string;
  Icon: typeof SvgIcon;
  real: boolean;
  suffix?: string;
}

const METRICS: MetricDef[] = [
  { key: 'totalOrganizations', label: 'Total Organizations', Icon: CorporateFareOutlinedIcon, real: true },
  { key: 'totalUsers', label: 'Total Users', Icon: GroupOutlinedIcon, real: true },
  { key: 'totalProjects', label: 'Total Projects', Icon: WorkOutlineOutlinedIcon, real: true },
  { key: 'totalProducts', label: 'Total Products', Icon: Inventory2OutlinedIcon, real: true },
  { key: 'totalRequirements', label: 'Total Requirements', Icon: DescriptionOutlinedIcon, real: true },
  { key: 'totalTestPlans', label: 'Total Test Plans', Icon: EventNoteOutlinedIcon, real: true },
  { key: 'totalTestCases', label: 'Total Test Cases', Icon: ChecklistOutlinedIcon, real: true },
  { key: 'totalTestSuites', label: 'Total Test Suites', Icon: LayersOutlinedIcon, real: true },
  { key: 'totalTestExecutions', label: 'Total Test Executions', Icon: PlayCircleOutlineOutlinedIcon, real: true },
  { key: 'totalDefects', label: 'Total Defects', Icon: BugReportOutlinedIcon, real: true },
  { key: 'passRate', label: 'Pass Rate', Icon: CheckCircleOutlinedIcon, real: true, suffix: '%' },
  { key: 'failedTests', label: 'Failed Tests', Icon: ErrorOutlineOutlinedIcon, real: true },
  { key: 'pendingTests', label: 'Pending Tests', Icon: HourglassEmptyOutlinedIcon, real: true },
];

const RESULT_COLORS: Record<string, string> = {
  Pass: '#2e7d32',
  Fail: '#c62828',
  Blocked: brand.amberDark,
  'Not Run': 'rgba(11,36,48,0.4)',
};

const PLACEHOLDER_CHARTS = [
  { label: 'Project Progress', Icon: TimelineOutlinedIcon, note: 'Populates once milestone/progress tracking is added to Project Management.' },
];

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const ACTIVITY_LABELS: Record<string, { label: string; Icon: typeof SvgIcon }> = {
  LOGIN: { label: 'signed in', Icon: LoginOutlinedIcon },
  LOGIN_FAILED: { label: 'had a failed sign-in attempt', Icon: LoginOutlinedIcon },
  PASSWORD_RESET_REQUESTED: { label: 'requested a password reset', Icon: LockResetOutlinedIcon },
  PASSWORD_RESET: { label: 'reset their password', Icon: LockResetOutlinedIcon },
  PASSWORD_CHANGED: { label: 'changed their password', Icon: LockResetOutlinedIcon },
  USER_CREATED: { label: 'created a user', Icon: PersonAddOutlinedIcon },
  USER_DEACTIVATED: { label: 'deactivated a user', Icon: PersonOffOutlinedIcon },
  USER_REACTIVATED: { label: 'reactivated a user', Icon: PersonAddOutlinedIcon },
  ORGANIZATION_CREATED: { label: 'created an organization', Icon: AddBusinessOutlinedIcon },
  ORGANIZATION_UPDATED: { label: 'updated an organization', Icon: EditOutlinedIcon },
  ORGANIZATION_DELETED: { label: 'deleted an organization', Icon: DeleteOutlineOutlinedIcon },
  ORGANIZATION_ADMIN_ASSIGNED: { label: 'assigned an organization admin', Icon: EditOutlinedIcon },
  PROJECT_CREATED: { label: 'created a project', Icon: WorkOutlineOutlinedIcon },
  PROJECT_UPDATED: { label: 'updated a project', Icon: EditOutlinedIcon },
  PROJECT_DELETED: { label: 'deleted a project', Icon: DeleteOutlineOutlinedIcon },
  PRODUCT_CREATED: { label: 'created a product', Icon: Inventory2OutlinedIcon },
  PRODUCT_UPDATED: { label: 'updated a product', Icon: EditOutlinedIcon },
  PRODUCT_DELETED: { label: 'deleted a product', Icon: DeleteOutlineOutlinedIcon },
  REQUIREMENT_CREATED: { label: 'created a requirement', Icon: DescriptionOutlinedIcon },
  REQUIREMENT_UPDATED: { label: 'updated a requirement', Icon: EditOutlinedIcon },
  REQUIREMENT_DELETED: { label: 'deleted a requirement', Icon: DeleteOutlineOutlinedIcon },
  TEST_PLAN_CREATED: { label: 'created a test plan', Icon: EventNoteOutlinedIcon },
  TEST_PLAN_UPDATED: { label: 'updated a test plan', Icon: EditOutlinedIcon },
  TEST_PLAN_DELETED: { label: 'deleted a test plan', Icon: DeleteOutlineOutlinedIcon },
  TEST_CASE_CREATED: { label: 'created a test case', Icon: ChecklistOutlinedIcon },
  TEST_CASE_UPDATED: { label: 'updated a test case', Icon: EditOutlinedIcon },
  TEST_CASE_DELETED: { label: 'deleted a test case', Icon: DeleteOutlineOutlinedIcon },
  TEST_SUITE_CREATED: { label: 'created a test suite', Icon: LayersOutlinedIcon },
  TEST_SUITE_UPDATED: { label: 'updated a test suite', Icon: EditOutlinedIcon },
  TEST_SUITE_DELETED: { label: 'deleted a test suite', Icon: DeleteOutlineOutlinedIcon },
  TEST_EXECUTION_CREATED: { label: 'recorded a test execution', Icon: PlayCircleOutlineOutlinedIcon },
  TEST_EXECUTION_UPDATED: { label: 'updated a test execution', Icon: EditOutlinedIcon },
  TEST_EXECUTION_DELETED: { label: 'deleted a test execution', Icon: DeleteOutlineOutlinedIcon },
  DEFECT_CREATED: { label: 'reported a defect', Icon: BugReportOutlinedIcon },
  DEFECT_UPDATED: { label: 'updated a defect', Icon: EditOutlinedIcon },
  DEFECT_DELETED: { label: 'deleted a defect', Icon: DeleteOutlineOutlinedIcon },
};

const ROLE_COLORS: Record<string, string> = {
  'Super Admin': brand.logoNavy,
  'Organization Admin': brand.amber,
  'Project Manager': '#7C4DFF',
  'Test Lead': '#2E86DE',
  Tester: '#22C55E',
  Developer: '#FF6B6B',
  Viewer: '#64748B',
};
const DEFAULT_ROLE_COLOR = brand.teal;

const ORG_STATUS_COLORS: Record<string, string> = {
  Active: '#22C55E',
  Suspended: brand.amber,
  Inactive: '#94A3B8',
};
const DEFAULT_STATUS_COLOR = brand.teal;

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<AuditLogEntry[]>([]);
  const canViewActivity = user?.permissions.includes('audit:read') ?? false;

  useEffect(() => {
    apiClient.get<DashboardSummary>('/dashboard/summary').then(({ data }) => setSummary(data)).catch(() => undefined);
    if (canViewActivity) {
      apiClient
        .get<AuditLogEntry[]>('/audit-logs', { params: { limit: 8 } })
        .then(({ data }) => setActivity(data))
        .catch(() => undefined);
    }
  }, [canViewActivity]);

  return (
    <AppShell title={`Welcome, ${user?.fullName}`}>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Signed in as {user?.email} · Roles: {user?.roles.join(', ') || 'None'}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 5,
        }}
      >
        {METRICS.map((metric) => {
          const value = metric.real && summary ? summary[metric.key as NumericMetricKey] : undefined;
          const isRestricted = metric.key === 'totalOrganizations' && summary?.scope === 'organization';
          const isOrgScoped = metric.key === 'totalUsers' && summary?.scope === 'organization';
          return (
            <Paper
              key={metric.label}
              elevation={0}
              sx={{ p: 2.25, borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}
            >
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
                <metric.Icon sx={{ fontSize: 19 }} />
              </Box>
              {isRestricted ? (
                <Chip
                  label="Super Admin only"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${brand.amber}20`, color: brand.amberDark }}
                />
              ) : metric.real ? (
                <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: brand.tealDark, lineHeight: 1 }}>
                  {value != null ? `${value}${metric.suffix ?? ''}` : '—'}
                </Typography>
              ) : (
                <Chip
                  label="Coming soon"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(11,36,48,0.06)', color: 'text.secondary' }}
                />
              )}
              <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: 'text.secondary', fontWeight: 600 }}>
                {metric.label}
                {isOrgScoped ? ' (your organization)' : ''}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Live Metrics
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 5,
          alignItems: 'stretch',
        }}
      >
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}>
          <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 1 }}>Users by Role</Typography>
          {summary && summary.usersByRole.length > 0 ? (
            <BarChart
              layout="horizontal"
              height={260}
              margin={{ top: 10, right: 20, bottom: 30 }}
              series={[
                {
                  data: summary.usersByRole.map((r) => r.count),
                  label: 'Users',
                },
              ]}
              yAxis={[
                {
                  data: summary.usersByRole.map((r) => r.role),
                  scaleType: 'band',
                  width: 'auto',
                  colorMap: {
                    type: 'ordinal',
                    values: summary.usersByRole.map((r) => r.role),
                    colors: summary.usersByRole.map((r) => ROLE_COLORS[r.role] ?? DEFAULT_ROLE_COLOR),
                  },
                },
              ]}
              xAxis={[{ tickMinStep: 1 }]}
              grid={{ vertical: true }}
              hideLegend
            />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
              No users yet.
            </Typography>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}>
          <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 1 }}>Organization Status</Typography>
          {summary?.organizationsByStatus ? (
            <PieChart
              height={260}
              series={[
                {
                  data: summary.organizationsByStatus.map((s) => ({
                    id: s.status,
                    value: s.count,
                    label: s.status,
                    color: ORG_STATUS_COLORS[s.status] ?? DEFAULT_STATUS_COLOR,
                  })),
                  innerRadius: 45,
                  outerRadius: 100,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  highlightScope: { fade: 'global', highlight: 'item' },
                },
              ]}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 1 }}>
              <Chip
                label="Super Admin only"
                size="small"
                sx={{ fontWeight: 700, bgcolor: `${brand.amber}20`, color: brand.amberDark }}
              />
              <Typography variant="caption" color="text.secondary">
                Visible to roles that manage organizations.
              </Typography>
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}>
          <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 1 }}>Sign-ins — Last 7 Days</Typography>
          {summary?.loginActivity ? (
            <BarChart
              height={260}
              margin={{ top: 10, right: 10, bottom: 30, left: 36 }}
              series={[{ data: summary.loginActivity.map((d) => d.count), label: 'Sign-ins', color: brand.teal }]}
              xAxis={[{ data: summary.loginActivity.map((d) => d.label), scaleType: 'band' }]}
              yAxis={[{ tickMinStep: 1 }]}
              grid={{ horizontal: true }}
              hideLegend
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                You don't have permission to view sign-in activity.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Testing &amp; Quality
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 5 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)', textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 1 }}>Testing Status</Typography>
          {summary?.testingStatus ? (
            <PieChart
              height={220}
              series={[
                {
                  data: [
                    { id: 'Pass', value: summary.testingStatus.pass, label: 'Pass', color: RESULT_COLORS.Pass },
                    { id: 'Fail', value: summary.testingStatus.fail, label: 'Fail', color: RESULT_COLORS.Fail },
                    { id: 'Blocked', value: summary.testingStatus.blocked, label: 'Blocked', color: RESULT_COLORS.Blocked },
                    { id: 'Not Run', value: summary.testingStatus.notRun, label: 'Not run', color: RESULT_COLORS['Not Run'] },
                  ].filter((slice) => slice.value > 0),
                  innerRadius: 40,
                  outerRadius: 90,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  highlightScope: { fade: 'global', highlight: 'item' },
                },
              ]}
            />
          ) : (
            <>
              <DonutLargeOutlinedIcon sx={{ fontSize: 40, color: 'rgba(11,36,48,0.15)', mb: 1, mt: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No data yet
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Passed / Failed / Blocked / Not Run, across all recorded test executions.
              </Typography>
            </>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)', textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 2 }}>Execution Summary</Typography>
          {summary?.latestExecution ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', py: 1.5 }}>
              <Chip
                label={summary.latestExecution.result}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: `${RESULT_COLORS[summary.latestExecution.result] ?? brand.teal}22`,
                  color: RESULT_COLORS[summary.latestExecution.result] ?? brand.teal,
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, color: brand.tealDark }}>
                {summary.latestExecution.testCaseCode} · {summary.latestExecution.testCaseTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {summary.latestExecution.executedByName ? `${summary.latestExecution.executedByName} · ` : ''}
                {formatDateTime(summary.latestExecution.executedAt)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Most recently updated execution — {summary.totalTestExecutions} total.
              </Typography>
            </Box>
          ) : (
            <>
              <InsightsOutlinedIcon sx={{ fontSize: 40, color: 'rgba(11,36,48,0.15)', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No data yet
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Populates once a test execution is recorded.
              </Typography>
            </>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)', textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 1 }}>Defect Trend</Typography>
          {summary ? (
            <BarChart
              height={220}
              margin={{ top: 10, right: 10, bottom: 30, left: 36 }}
              series={[{ data: summary.defectTrend.map((d) => d.count), label: 'Defects reported', color: brand.amberDark }]}
              xAxis={[{ data: summary.defectTrend.map((d) => d.label), scaleType: 'band' }]}
              yAxis={[{ tickMinStep: 1 }]}
              grid={{ horizontal: true }}
              hideLegend
            />
          ) : (
            <>
              <TrendingUpOutlinedIcon sx={{ fontSize: 40, color: 'rgba(11,36,48,0.15)', mb: 1, mt: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No data yet
              </Typography>
            </>
          )}
        </Paper>

        {PLACEHOLDER_CHARTS.map((chart) => (
          <Paper
            key={chart.label}
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)', textAlign: 'center' }}
          >
            <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 2 }}>{chart.label}</Typography>
            <chart.Icon sx={{ fontSize: 40, color: 'rgba(11,36,48,0.15)', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No data yet
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {chart.note}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Recent Activities
      </Typography>
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(11,36,48,0.08)' }}>
        {!canViewActivity ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
            You don't have permission to view system activity.
          </Typography>
        ) : activity.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
            No activity recorded yet.
          </Typography>
        ) : (
          activity.map((entry, index) => {
            const meta = ACTIVITY_LABELS[entry.action] ?? { label: entry.action.toLowerCase().replace(/_/g, ' '), Icon: InsightsOutlinedIcon };
            return (
              <Box
                key={entry.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2.5,
                  py: 1.5,
                  borderTop: index === 0 ? 'none' : '1px solid rgba(11,36,48,0.06)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: `${brand.teal}14`,
                    color: brand.teal,
                    flexShrink: 0,
                  }}
                >
                  <meta.Icon sx={{ fontSize: 16 }} />
                </Box>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  <strong>{entry.user?.fullName ?? 'System'}</strong> {meta.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatRelativeTime(entry.createdAt)}
                </Typography>
              </Box>
            );
          })
        )}
      </Paper>
    </AppShell>
  );
}
