import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestExecutionDto } from './dto/create-test-execution.dto';
import type { UpdateTestExecutionDto } from './dto/update-test-execution.dto';

const withRelations = {
  project: { select: { id: true, name: true, code: true } },
  testCase: { select: { id: true, title: true, code: true } },
  testPlan: { select: { id: true, title: true, code: true } },
  testSuite: { select: { id: true, name: true, code: true } },
  executedBy: { select: { id: true, fullName: true, email: true } },
} as const;

// The service computes the executed-by/at stamp alongside whatever fields the
// caller is updating, so the repository accepts those on top of the DTO shape.
// `executedAt` is Omit'd from the DTO first — otherwise intersecting its
// string type with this Date type here would collapse to `string & Date`.
interface ExecutionStamp {
  executedById?: string | null;
  executedAt?: Date | null;
}

type CreateTestExecutionWrite = Omit<CreateTestExecutionDto, 'executedAt'> &
  ExecutionStamp;
type UpdateTestExecutionWrite = Omit<UpdateTestExecutionDto, 'executedAt'> &
  ExecutionStamp;

@Injectable()
export class TestExecutionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForOrganization(organizationId: string) {
    return this.prisma.testExecution.findMany({
      where: { organizationId },
      include: withRelations,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.testExecution.findUnique({
      where: { id },
      include: withRelations,
    });
  }

  create(organizationId: string, data: CreateTestExecutionWrite) {
    return this.prisma.testExecution.create({
      data: {
        code: data.code,
        cycle: data.cycle,
        result: data.result,
        actualResult: data.actualResult,
        notes: data.notes,
        environment: data.environment,
        executedAt: data.executedAt,
        projectId: data.projectId,
        organizationId,
        testCaseId: data.testCaseId,
        testPlanId: data.testPlanId,
        testSuiteId: data.testSuiteId,
        executedById: data.executedById,
      },
      include: withRelations,
    });
  }

  update(id: string, data: UpdateTestExecutionWrite) {
    return this.prisma.testExecution.update({
      where: { id },
      data: {
        code: data.code,
        cycle: data.cycle,
        result: data.result,
        actualResult: data.actualResult,
        notes: data.notes,
        environment: data.environment,
        executedAt: data.executedAt,
        projectId: data.projectId,
        testCaseId: data.testCaseId,
        testPlanId: data.testPlanId,
        testSuiteId: data.testSuiteId,
        executedById: data.executedById,
      },
      include: withRelations,
    });
  }

  delete(id: string) {
    return this.prisma.testExecution.delete({ where: { id } });
  }
}
