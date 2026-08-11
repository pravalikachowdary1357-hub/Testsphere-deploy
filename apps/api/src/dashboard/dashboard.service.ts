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
      totalTestCases,
      totalTestSuites,
      executionResultRows,
      latestExecution,
      totalDefects,
      defectRows,
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
      this.prisma.testCase.count({
        where: { organizationId: actor.organizationId },
      }),
      this.prisma.testSuite.count({
        where: { organizationId: actor.organizationId },
      }),
      this.prisma.testExecution.groupBy({
        by: ['result'],
        where: { organizationId: actor.organizationId },
        _count: true,
      }),
      this.prisma.testExecution.findFirst({
        where: { organizationId: actor.organizationId },
        orderBy: { updatedAt: 'desc' },
        include: {
          testCase: { select: { title: true, code: true } },
          executedBy: { select: { fullName: true } },
        },
      }),
      this.prisma.defect.count({
        where: { organizationId: actor.organizationId },
      }),
      this.prisma.defect.findMany({
        where: {
          organizationId: actor.organizationId,
          createdAt: { gte: windowStart },
        },
        select: { createdAt: true },
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

    const resultCounts = new Map<string, number>();
    for (const row of executionResultRows) {
      resultCounts.set(row.result, row._count);
    }
    const passCount = resultCounts.get('Pass') ?? 0;
    const failCount = resultCounts.get('Fail') ?? 0;
    const blockedCount = resultCounts.get('Blocked') ?? 0;
    const notRunCount = resultCounts.get('Not Run') ?? 0;
    const retestCount = resultCounts.get('Retest') ?? 0;
    const totalTestExecutions =
      passCount + failCount + blockedCount + notRunCount + retestCount;
    // Pass rate reflects the quality of what's actually been run — cases still
    // "Not Run" haven't produced a result yet, so they don't dilute it.
    const executedCount = totalTestExecutions - notRunCount;
    const passRate =
      executedCount > 0 ? Math.round((passCount / executedCount) * 100) : null;

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

    const defectBuckets = new Map<string, number>();
    for (let i = 0; i < ACTIVITY_WINDOW_DAYS; i += 1) {
      const day = new Date(windowStart);
      day.setUTCDate(day.getUTCDate() + i);
      defectBuckets.set(toDateKey(day), 0);
    }
    for (const row of defectRows) {
      const key = toDateKey(row.createdAt);
      defectBuckets.set(key, (defectBuckets.get(key) ?? 0) + 1);
    }
    const defectTrend = Array.from(defectBuckets, ([date, count]) => ({
      date,
      label: new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
        weekday: 'short',
      }),
      count,
    }));

    return {
      totalOrganizations,
      totalUsers,
      totalProjects,
      totalProducts,
      totalRequirements,
      totalTestPlans,
      totalTestCases,
      totalTestSuites,
      totalTestExecutions,
      passRate,
      failedTests: failCount,
      pendingTests: notRunCount,
      testingStatus:
        totalTestExecutions > 0
          ? { pass: passCount, fail: failCount, blocked: blockedCount, notRun: notRunCount + retestCount }
          : null,
      latestExecution: latestExecution
        ? {
            code: latestExecution.code,
            result: latestExecution.result,
            testCaseTitle: latestExecution.testCase.title,
            testCaseCode: latestExecution.testCase.code,
            executedByName: latestExecution.executedBy?.fullName ?? null,
            executedAt: latestExecution.executedAt,
          }
        : null,
      totalDefects,
      defectTrend,
      scope: isSystemWide ? ('system' as const) : ('organization' as const),
      usersByRole,
      organizationsByStatus,
      loginActivity,
    };
  }
}
