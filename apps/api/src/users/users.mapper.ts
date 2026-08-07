import type { AuthenticatedUser } from '../common/types/authenticated-user';
import type { UserWithAccess } from './users.repository';

export function toAuthenticatedUser(user: UserWithAccess): AuthenticatedUser {
  const roles = user.roles.map((userRole) => userRole.role.name);
  const permissions = new Set<string>();
  for (const userRole of user.roles) {
    for (const rolePermission of userRole.role.permissions) {
      permissions.add(rolePermission.permission.key);
    }
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    organizationId: user.organizationId,
    roles,
    permissions: Array.from(permissions),
  };
}

export function toUserSummary(user: {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    organizationId: user.organizationId,
    createdAt: user.createdAt,
  };
}
