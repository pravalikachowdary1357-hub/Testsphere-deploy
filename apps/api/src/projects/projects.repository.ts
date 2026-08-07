import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';

const withManager = {
  projectManager: { select: { id: true, fullName: true, email: true } },
} as const;

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForOrganization(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId },
      include: withManager,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: withManager,
    });
  }

  create(organizationId: string, data: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        projectManagerId: data.projectManagerId,
        organizationId,
      },
      include: withManager,
    });
  }

  update(id: string, data: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        projectManagerId: data.projectManagerId,
      },
      include: withManager,
    });
  }

  delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
