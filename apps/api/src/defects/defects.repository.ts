import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDefectDto } from './dto/create-defect.dto';
import type { UpdateDefectDto } from './dto/update-defect.dto';

const withRelations = {
  project: { select: { id: true, name: true, code: true } },
  testExecution: {
    select: {
      id: true,
      code: true,
      result: true,
      testCase: { select: { id: true, title: true, code: true } },
    },
  },
  requirement: { select: { id: true, title: true, code: true } },
  reportedBy: { select: { id: true, fullName: true, email: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
  resolvedBy: { select: { id: true, fullName: true, email: true } },
} as const;

// The service computes the resolved-by/at stamp alongside whatever fields the
// caller is updating, so the repository accepts those on top of the DTO shape.
interface ResolutionStamp {
  resolvedById?: string | null;
  resolvedAt?: Date | null;
}

type CreateDefectWrite = CreateDefectDto & ResolutionStamp;
type UpdateDefectWrite = UpdateDefectDto & ResolutionStamp;

@Injectable()
export class DefectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForOrganization(organizationId: string) {
    return this.prisma.defect.findMany({
      where: { organizationId },
      include: withRelations,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.defect.findUnique({
      where: { id },
      include: withRelations,
    });
  }

  create(organizationId: string, data: CreateDefectWrite, reportedById: string) {
    return this.prisma.defect.create({
      data: {
        title: data.title,
        code: data.code,
        description: data.description,
        stepsToReproduce: data.stepsToReproduce,
        severity: data.severity,
        priority: data.priority,
        status: data.status,
        environment: data.environment,
        resolution: data.resolution,
        projectId: data.projectId,
        organizationId,
        testExecutionId: data.testExecutionId,
        requirementId: data.requirementId,
        assignedToId: data.assignedToId,
        reportedById,
        resolvedById: data.resolvedById,
        resolvedAt: data.resolvedAt,
      },
      include: withRelations,
    });
  }

  update(id: string, data: UpdateDefectWrite) {
    return this.prisma.defect.update({
      where: { id },
      data: {
        title: data.title,
        code: data.code,
        description: data.description,
        stepsToReproduce: data.stepsToReproduce,
        severity: data.severity,
        priority: data.priority,
        status: data.status,
        environment: data.environment,
        resolution: data.resolution,
        projectId: data.projectId,
        testExecutionId: data.testExecutionId,
        requirementId: data.requirementId,
        assignedToId: data.assignedToId,
        resolvedById: data.resolvedById,
        resolvedAt: data.resolvedAt,
      },
      include: withRelations,
    });
  }

  delete(id: string) {
    return this.prisma.defect.delete({ where: { id } });
  }
}
