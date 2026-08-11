import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestSuiteDto } from './dto/create-test-suite.dto';
import type { UpdateTestSuiteDto } from './dto/update-test-suite.dto';

const withRelations = {
  project: { select: { id: true, name: true, code: true } },
  createdBy: { select: { id: true, fullName: true, email: true } },
  testCases: { select: { id: true, title: true, code: true, status: true } },
} as const;

@Injectable()
export class TestSuitesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForOrganization(organizationId: string) {
    return this.prisma.testSuite.findMany({
      where: { organizationId },
      include: withRelations,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.testSuite.findUnique({
      where: { id },
      include: withRelations,
    });
  }

  create(organizationId: string, data: CreateTestSuiteDto, createdById: string) {
    return this.prisma.testSuite.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        type: data.type,
        status: data.status,
        projectId: data.projectId,
        organizationId,
        createdById,
        testCases: data.testCaseIds
          ? { connect: data.testCaseIds.map((id) => ({ id })) }
          : undefined,
      },
      include: withRelations,
    });
  }

  update(id: string, data: UpdateTestSuiteDto) {
    return this.prisma.testSuite.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        type: data.type,
        status: data.status,
        projectId: data.projectId,
        testCases: data.testCaseIds
          ? { set: data.testCaseIds.map((id) => ({ id })) }
          : undefined,
      },
      include: withRelations,
    });
  }

  delete(id: string) {
    return this.prisma.testSuite.delete({ where: { id } });
  }
}
