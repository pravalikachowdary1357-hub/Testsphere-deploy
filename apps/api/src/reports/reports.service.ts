import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

const OPEN_DEFECT_EXCLUDED_STATUSES = ['Closed', 'Rejected', 'Duplicate', 'Cannot Reproduce'];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(actor: AuthenticatedUser) {
    const organizationId = actor.organizationId;

    const [requirements, defectExecutionLinks, executionResultRows, openCriticalDefects] =
      await Promise.all([
        this.prisma.requirement.findMany({
          where: { organizationId },
          include: {
            testCases: {
              include: {
                executions: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
          orderBy: { code: 'asc' },
        }),
        this.prisma.defect.findMany({
          where: { organizationId, testExecutionId: { not: null } },
          select: { testExecution: { select: { testCaseId: true } } },
        }),
        this.prisma.testExecution.groupBy({
          by: ['result'],
          where: { organizationId },
          _count: true,
        }),
        this.prisma.defect.count({
          where: {
            organizationId,
            severity: 'Critical',
            status: { notIn: OPEN_DEFECT_EXCLUDED_STATUSES },
          },
        }),
      ]);

    const defectCountByTestCase = new Map<string, number>();
    for (const link of defectExecutionLinks) {
      const testCaseId = link.testExecution?.testCaseId;
      if (!testCaseId) continue;
      defectCountByTestCase.set(testCaseId, (defectCountByTestCase.get(testCaseId) ?? 0) + 1);
    }

    const resultCounts = new Map<string, number>();
    for (const row of executionResultRows) {
      resultCounts.set(row.result, row._count);
    }
    const passCount = resultCounts.get('Pass') ?? 0;
    const failCount = resultCounts.get('Fail') ?? 0;
    const blockedCount = resultCounts.get('Blocked') ?? 0;
    const notRunCount = resultCounts.get('Not Run') ?? 0;
    const retestCount = resultCounts.get('Retest') ?? 0;
    const totalExecutions = passCount + failCount + blockedCount + notRunCount + retestCount;
    const executedCount = totalExecutions - notRunCount;
    const passRate = executedCount > 0 ? Math.round((passCount / executedCount) * 100) : null;

    const traceability = requirements.map((requirement) => ({
      requirementId: requirement.id,
      requirementCode: requirement.code,
      requirementTitle: requirement.title,
      requirementStatus: requirement.status,
      requirementPriority: requirement.priority,
      testCases: requirement.testCases.map((testCase) => ({
        testCaseId: testCase.id,
        testCaseCode: testCase.code,
        testCaseTitle: testCase.title,
        testCaseStatus: testCase.status,
        latestResult: testCase.executions[0]?.result ?? null,
        defectCount: defectCountByTestCase.get(testCase.id) ?? 0,
      })),
    }));

    const totalRequirements = requirements.length;
    const coveredRequirements = requirements.filter((r) => r.testCases.length > 0).length;
    const coverage = totalRequirements > 0 ? Math.round((coveredRequirements / totalRequirements) * 100) : 0;

    // Coverage and pass rate each carry a third of the score; the final third
    // is a penalty for open critical defects, which also caps the verdict
    // below "Ready" no matter how high the score climbs — a release doesn't
    // ship with an open critical bug just because the rest looks good.
    const passScore = passRate ?? 0;
    const criticalPenalty = Math.max(0, 100 - openCriticalDefects * 25);
    const score = Math.round(coverage * 0.35 + passScore * 0.35 + criticalPenalty * 0.3);

    let verdict: 'Ready' | 'Conditional' | 'Not Ready';
    if (openCriticalDefects > 0) {
      verdict = score >= 50 ? 'Conditional' : 'Not Ready';
    } else {
      verdict = score >= 80 ? 'Ready' : score >= 50 ? 'Conditional' : 'Not Ready';
    }

    return {
      qualityScore: {
        score,
        verdict,
        coverage,
        passRate,
        openCriticalDefects,
        totalRequirements,
        coveredRequirements,
      },
      traceability,
    };
  }
}
