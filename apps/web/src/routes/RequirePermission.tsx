import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface RequirePermissionProps {
  permission: string;
}

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { user } = useAuth();
  const hasPermission = user?.permissions.includes(permission) ?? false;

  if (!hasPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
