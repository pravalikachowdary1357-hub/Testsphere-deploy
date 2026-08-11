import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRequirementDto } from './dto/create-requirement.dto';
import type { UpdateRequirementDto } from './dto/update-requirement.dto';

const withRelations = {
  project: { select: { id: true, name: true, code: true } },
  createdBy: { select: { id: true, fullName: true, email: true } },
  approvedBy: { select: { id: true, fullName: true, email: true } },
} as const;

// The service computes version/approval alongside whatever fields the caller
// is updating, so the repository accepts those on top of the plain DTO shape.
interface RequirementWrite extends UpdateRequirementDto {
  version?: number;
  approvedById?: string | null;
  approvedAt?: Date | null;
}

@Injectable()
export class RequirementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForOrganization(organizationId: string) {
    return this.prisma.requirement.findMany({
      where: { organizationId },
      include: withRelations,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.requirement.findUnique({
      where: { id },
      include: withRelations,
    });
  }

  create(
    organizationId: string,
    data: CreateRequirementDto,
    createdById: string,
  ) {
    return this.prisma.requirement.create({
      data: {
        title: data.title,
        code: data.code,
        description: data.description,
        type: data.type,
        priority: data.priority,
        status: data.status,
        projectId: data.projectId,
        organizationId,
        createdById,
      },
      include: withRelations,
    });
  }

  update(id: string, data: RequirementWrite) {
    return this.prisma.requirement.update({
      where: { id },
      data: {
        title: data.title,
        code: data.code,
        description: data.description,
        type: data.type,
        priority: data.priority,
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
    return this.prisma.requirement.delete({ where: { id } });
  }
}
