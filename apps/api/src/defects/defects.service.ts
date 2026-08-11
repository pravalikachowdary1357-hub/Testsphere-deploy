import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { ProjectsService } from '../projects/projects.service';
import type { CreateDefectDto } from './dto/create-defect.dto';
import type { UpdateDefectDto } from './dto/update-defect.dto';
import { toDefectSummary } from './defects.mapper';
import { DefectsRepository } from './defects.repository';

@Injectable()
export class DefectsService {
  constructor(
    private readonly defectsRepository: DefectsRepository,
    private readonly auditService: AuditService,
    private readonly projectsService: ProjectsService,
  ) {}

  async list(organizationId: string) {
    const defects = await this.defectsRepository.findAllForOrganization(organizationId);
    return defects.map(toDefectSummary);
  }

  async findOne(id: string, organizationId: string) {
    return toDefectSummary(await this.findEntity(id, organizationId));
  }

  private async findEntity(id: string, organizationId: string) {
    const defect = await this.defectsRepository.findById(id);
    if (!defect || defect.organizationId !== organizationId) {
      throw new NotFoundException('Defect not found');
    }
    return defect;
  }

  async create(
    organizationId: string,
    dto: CreateDefectDto,
    actor: AuthenticatedUser,
  ) {
    await this.projectsService.findOne(dto.projectId, organizationId);

    // A defect created directly as "Closed" (rare, but possible for a
    // same-day fix) is resolved from the moment it exists.
    const isResolved = dto.status === 'Closed';

    try {
      const defect = await this.defectsRepository.create(
        organizationId,
        {
          ...dto,
          resolvedById: isResolved ? actor.id : undefined,
          resolvedAt: isResolved ? new Date() : undefined,
        },
        actor.id,
      );
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'DEFECT_CREATED',
        entityType: 'Defect',
        entityId: defect.id,
        metadata: { title: defect.title, code: defect.code },
      });
      return toDefectSummary(defect);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A defect with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateDefectDto,
    actor: AuthenticatedUser,
  ) {
    const existing = await this.findEntity(id, organizationId);
    if (dto.projectId && dto.projectId !== existing.projectId) {
      await this.projectsService.findOne(dto.projectId, organizationId);
    }

    // "Closed" carries who resolved it and when — stamp that the moment
    // status transitions in, and clear it the moment status moves back out
    // (e.g. Reopened), so it always reflects the current state.
    const nextStatus = dto.status ?? existing.status;
    const isNewlyResolved = nextStatus === 'Closed' && existing.status !== 'Closed';
    const isNoLongerResolved = nextStatus !== 'Closed' && existing.status === 'Closed';

    try {
      const defect = await this.defectsRepository.update(id, {
        ...dto,
        resolvedById: isNewlyResolved ? actor.id : isNoLongerResolved ? null : undefined,
        resolvedAt: isNewlyResolved ? new Date() : isNoLongerResolved ? null : undefined,
      });
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'DEFECT_UPDATED',
        entityType: 'Defect',
        entityId: id,
        metadata: { changes: dto },
      });
      return toDefectSummary(defect);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A defect with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string, actor: AuthenticatedUser) {
    const defect = await this.findOne(id, organizationId);

    await this.auditService.record({
      organizationId,
      userId: actor.id,
      action: 'DEFECT_DELETED',
      entityType: 'Defect',
      entityId: id,
      metadata: { title: defect.title, code: defect.code },
    });
    await this.defectsRepository.delete(id);
  }
}
