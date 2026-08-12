import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { apiClient } from './api/client';
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
import { TestSuiteManagementPage } from './pages/TestSuiteManagementPage';
import { TestExecutionManagementPage } from './pages/TestExecutionManagementPage';
import { DefectManagementPage } from './pages/DefectManagementPage';
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage';
import { RoleManagementPage } from './pages/RoleManagementPage';
import { PermissionManagementPage } from './pages/PermissionManagementPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
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

// Render's free tier spins the API down after ~15 minutes with no traffic.
// A scheduled external ping (outside this app) is the only way to keep it
// warm when nobody has TestSphere open at all — but while at least one tab
// IS open, this keeps it from going cold in between, so switching between
// pages or roles during a session doesn't keep re-triggering a cold start.
const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000;

function useKeepApiWarm() {
  useEffect(() => {
    const interval = setInterval(() => {
      apiClient.get('/health').catch(() => undefined);
    }, KEEP_ALIVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
}

function App() {
  useKeepApiWarm();

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

        <Route element={<RequirePermission permission="organization:read" />}>
          <Route path="/admin/organizations" element={<OrganizationManagementPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
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
        <Route element={<RequirePermission permission="testsuite:read" />}>
          <Route path="/admin/test-suites" element={<TestSuiteManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="testexecution:read" />}>
          <Route path="/admin/test-execution" element={<TestExecutionManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="defect:read" />}>
          <Route path="/admin/defects" element={<DefectManagementPage />} />
        </Route>
        <Route element={<RequirePermission permission="report:read" />}>
          <Route path="/admin/reports" element={<ReportsAnalyticsPage />} />
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
