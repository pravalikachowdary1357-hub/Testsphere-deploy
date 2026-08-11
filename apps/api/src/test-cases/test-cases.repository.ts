import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestCaseDto } from './dto/create-test-case.dto';
import type { UpdateTestCaseDto } from './dto/update-test-case.dto';

const withRelations = {
  project: { select: { id: true, name: true, code: true } },
  createdBy: { select: { id: true, fullName: true, email: true } },
  approvedBy: { select: { id: true, fullName: true, email: true } },
} as const;

// The service computes version/approval alongside whatever fields the caller
// is updating, so the repository accepts those on top of the plain DTO shape.
interface TestCaseWrite extends UpdateTestCaseDto {
  version?: number;
  approvedById?: string | null;
  approvedAt?: Date | null;
}

@Injectable()
export class TestCasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForOrganization(organizationId: string) {
    return this.prisma.testCase.findMany({
      where: { organizationId },
      include: withRelations,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.testCase.findUnique({
      where: { id },
      include: withRelations,
    });
  }

  create(organizationId: string, data: CreateTestCaseDto, createdById: string) {
    return this.prisma.testCase.create({
      data: {
        title: data.title,
        code: data.code,
        description: data.description,
        preconditions: data.preconditions,
        steps: data.steps,
        expectedResult: data.expectedResult,
        testData: data.testData,
        type: data.type,
        priority: data.priority,
        risk: data.risk,
        tags: data.tags,
        status: data.status,
        projectId: data.projectId,
        organizationId,
        createdById,
      },
      include: withRelations,
    });
  }

  update(id: string, data: TestCaseWrite) {
    return this.prisma.testCase.update({
      where: { id },
      data: {
        title: data.title,
        code: data.code,
        description: data.description,
        preconditions: data.preconditions,
        steps: data.steps,
        expectedResult: data.expectedResult,
        testData: data.testData,
        type: data.type,
        priority: data.priority,
        risk: data.risk,
        tags: data.tags,
        status: data.status,
        projectId: data.projectId,
        version: data.version,
        approvedById: data.approvedById,
        approvedAt: data.approvedAt,
      },
      include: withRelations,
    });
  }

  delete(id: string) {
    return this.prisma.testCase.delete({ where: { id } });
  }
}
