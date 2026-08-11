import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

const ACTIVITY_WINDOW_DAYS = 7;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(actor: AuthenticatedUser) {
    const isSystemWide = actor.permissions.includes('organization:read');
    const canViewActivity = actor.permissions.includes('audit:read');
    const orgFilter = isSystemWide ? undefined : actor.organizationId;

    const now = new Date();
    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const windowStart = new Date(todayUtc);
    windowStart.setUTCDate(
      windowStart.getUTCDate() - (ACTIVITY_WINDOW_DAYS - 1),
    );

    const [
      totalOrganizations,
      totalUsers,
      totalProjects,
      totalProducts,
      totalRequirements,
      totalTestPlans,
      userRoleRows,
      organizationStatusRows,
      loginRows,
    ] = await Promise.all([
      isSystemWide ? this.prisma.organization.count() : Promise.resolve(null),
      orgFilter
        ? this.prisma.user.count({ where: { organizationId: orgFilter } })
        : this.prisma.user.count(),
      this.prisma.project.count({
        where: { organizationId: actor.organizationId },
      }),
      this.prisma.product.count({
        where: { organizationId: actor.organizationId },
      }),
      this.prisma.requirement.count({
        where: { organizationId: actor.organizationId },
      }),
      this.prisma.testPlan.count({
        where: { organizationId: actor.organizationId },
      }),
      this.prisma.userRole.findMany({
        where: orgFilter ? { user: { organizationId: orgFilter } } : undefined,
        select: { role: { select: { name: true } } },
      }),
      isSystemWide
        ? this.prisma.organization.groupBy({ by: ['status'], _count: true })
        : Promise.resolve(null),
      canViewActivity
        ? this.prisma.auditLog.findMany({
            where: {
              action: 'LOGIN',
              createdAt: { gte: windowStart },
              ...(orgFilter ? { organizationId: orgFilter } : {}),
            },
            select: { createdAt: true },
          })
        : Promise.resolve(null),
    ]);

    const roleCounts = new Map<string, number>();
    for (const row of userRoleRows) {
      roleCounts.set(row.role.name, (roleCounts.get(row.role.name) ?? 0) + 1);
    }
    const usersByRole = Array.from(roleCounts, ([role, count]) => ({
      role,
      count,
    }));

    const organizationsByStatus = organizationStatusRows
      ? organizationStatusRows.map((row) => ({
          status: row.status,
          count: row._count,
        }))
      : null;

    let loginActivity: Array<{
      date: string;
      label: string;
      count: number;
    }> | null = null;
    if (loginRows) {
      const buckets = new Map<string, number>();
      for (let i = 0; i < ACTIVITY_WINDOW_DAYS; i += 1) {
        const day = new Date(windowStart);
        day.setUTCDate(day.getUTCDate() + i);
        buckets.set(toDateKey(day), 0);
      }
      for (const row of loginRows) {
        const key = toDateKey(row.createdAt);
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      loginActivity = Array.from(buckets, ([date, count]) => ({
        date,
        label: new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
          weekday: 'short',
        }),
        count,
      }));
    }

    return {
      totalOrganizations,
      totalUsers,
      totalProjects,
      totalProducts,
      totalRequirements,
      totalTestPlans,
      scope: isSystemWide ? ('system' as const) : ('organization' as const),
      usersByRole,
      organizationsByStatus,
      loginActivity,
    };
  }
}
