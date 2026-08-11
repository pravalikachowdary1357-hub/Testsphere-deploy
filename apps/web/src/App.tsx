import { Box, CircularProgress } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { DemoCredentialsPage } from './pages/DemoCredentialsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { OrganizationManagementPage } from './pages/OrganizationManagementPage';
import { ProjectManagementPage } from './pages/ProjectManagementPage';
import { ProductManagementPage } from './pages/ProductManagementPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { RequirementManagementPage } from './pages/RequirementManagementPage';
import { TestPlanManagementPage } from './pages/TestPlanManagementPage';
import { TestCaseManagementPage } from './pages/TestCaseManagementPage';
import { RoleManagementPage } from './pages/RoleManagementPage';
import { PermissionManagementPage } from './pages/PermissionManagementPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RequirePermission } from './routes/RequirePermission';
import { useAuth } from './auth/AuthContext';

function RootRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />;
}

const COMING_SOON_ROUTES: Array<{ path: string; title: string; Icon: typeof WorkOutlineOutlinedIcon; description: string }> = [
  { path: '/admin/test-suites', title: 'Test Suite Management', Icon: LayersOutlinedIcon, description: 'Group test cases into reusable suites for execution. Ships in Milestone 6.' },
  { path: '/admin/test-execution', title: 'Test Execution', Icon: PlayCircleOutlineOutlinedIcon, description: 'Run test cycles and log Pass/Fail/Blocked/Retest results. Ships in Milestone 6.' },
  { path: '/admin/defects', title: 'Defect Management', Icon: BugReportOutlinedIcon, description: 'Track defects through their full lifecycle. Ships in Milestone 7.' },
  { path: '/admin/reports', title: 'Reports & Analytics', Icon: AssessmentOutlinedIcon, description: 'Traceability matrix and Release Quality Score. Ships in Milestones 8–9.' },
  { path: '/admin/settings', title: 'Settings', Icon: SettingsOutlinedIcon, description: 'Organization-wide configuration. Ships alongside the modules it configures.' },
];

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/demo-credentials" element={<DemoCredentialsPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {COMING_SOON_ROUTES.map(({ path, title, Icon, description }) => (
          <Route key={path} path={path} element={<ComingSoonPage title={title} Icon={Icon} description={description} />} />
        ))}

        <Route element={<RequirePermission permission="organization:read" />}>
          <Route path="/admin/organizations" element={<OrganizationManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="project:read" />}>
          <Route path="/admin/projects" element={<ProjectManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="product:read" />}>
          <Route path="/admin/products" element={<ProductManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="requirement:read" />}>
          <Route path="/admin/requirements" element={<RequirementManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="testplan:read" />}>
          <Route path="/admin/test-plans" element={<TestPlanManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="testcase:read" />}>
          <Route path="/admin/test-cases" element={<TestCaseManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="user:read" />}>
          <Route path="/admin/users" element={<UserManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="role:read" />}>
          <Route path="/admin/roles" element={<RoleManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="permission:read" />}>
          <Route path="/admin/permissions" element={<PermissionManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="audit:read" />}>
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
