import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { UsersService } from '../users/users.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
import { toProjectSummary } from './projects.mapper';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  async list(organizationId: string) {
    const projects =
      await this.projectsRepository.findAllForOrganization(organizationId);
    return projects.map(toProjectSummary);
  }

  async findOne(id: string, organizationId: string) {
    const project = await this.projectsRepository.findById(id);
    if (!project || project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }
    return toProjectSummary(project);
  }

  async create(
    organizationId: string,
    dto: CreateProjectDto,
    actor: AuthenticatedUser,
  ) {
    if (dto.projectManagerId) {
      await this.usersService.findOneInOrganization(
        dto.projectManagerId,
        organizationId,
      );
    }

    try {
      const project = await this.projectsRepository.create(organizationId, dto);
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: project.id,
        metadata: { name: project.name, code: project.code },
      });
      return toProjectSummary(project);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A project with this code already exists in this organization',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateProjectDto,
    actor: AuthenticatedUser,
  ) {
    await this.findOne(id, organizationId);
    if (dto.projectManagerId) {
      await this.usersService.findOneInOrganization(
        dto.projectManagerId,
        organizationId,
      );
    }

    try {
      const project = await this.projectsRepository.update(id, dto);
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'PROJECT_UPDATED',
        entityType: 'Project',
        entityId: id,
        metadata: { changes: dto },
      });
      return toProjectSummary(project);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A project with this code already exists in this organization',
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string, actor: AuthenticatedUser) {
    const project = await this.findOne(id, organizationId);

    await this.auditService.record({
      organizationId,
      userId: actor.id,
      action: 'PROJECT_DELETED',
      entityType: 'Project',
      entityId: id,
      metadata: { name: project.name, code: project.code },
    });
    await this.projectsRepository.delete(id);
  }
}
