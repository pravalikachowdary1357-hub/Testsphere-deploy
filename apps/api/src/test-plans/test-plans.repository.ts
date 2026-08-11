import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestPlanDto } from './dto/create-test-plan.dto';
import type { UpdateTestPlanDto } from './dto/update-test-plan.dto';

const withRelations = {
  project: { select: { id: true, name: true, code: true } },
  createdBy: { select: { id: true, fullName: true, email: true } },
  approvedBy: { select: { id: true, fullName: true, email: true } },
} as const;

// The service computes version/approval alongside whatever fields the caller
// is updating, so the repository accepts those on top of the plain DTO shape.
interface TestPlanWrite extends UpdateTestPlanDto {
  version?: number;
  approvedById?: string | null;
  approvedAt?: Date | null;
}

@Injectable()
export class TestPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForOrganization(organizationId: string) {
    return this.prisma.testPlan.findMany({
      where: { organizationId },
      include: withRelations,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.testPlan.findUnique({
      where: { id },
      include: withRelations,
    });
  }

  create(organizationId: string, data: CreateTestPlanDto, createdById: string) {
    return this.prisma.testPlan.create({
      data: {
        title: data.title,
        code: data.code,
        description: data.description,
        scope: data.scope,
        strategy: data.strategy,
        entryCriteria: data.entryCriteria,
        exitCriteria: data.exitCriteria,
        environment: data.environment,
        releaseVersion: data.releaseVersion,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        projectId: data.projectId,
        organizationId,
        createdById,
      },
      include: withRelations,
    });
  }

  update(id: string, data: TestPlanWrite) {
    return this.prisma.testPlan.update({
      where: { id },
      data: {
        title: data.title,
        code: data.code,
        description: data.description,
        scope: data.scope,
        strategy: data.strategy,
        entryCriteria: data.entryCriteria,
        exitCriteria: data.exitCriteria,
        environment: data.environment,
        releaseVersion: data.releaseVersion,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        projectId: data.projectId,
        version: data.version,
        approvedById: data.approvedById,
        approvedAt: data.approvedAt,
      },
      include: withRelations,
    });
  }

  delete(id: string) {
    return this.prisma.testPlan.delete({ where: { id } });
  }
}
