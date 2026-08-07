import type { Organization } from '@prisma/client';

type OrganizationWithCount = Organization & { _count: { users: number } };

export function toOrganizationSummary(org: OrganizationWithCount) {
  const { _count, ...rest } = org;
  return { ...rest, userCount: _count.users };
}
