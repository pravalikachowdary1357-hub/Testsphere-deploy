import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuditService } from '../audit/audit.service';
import type {
  BulkImportDto,
  BulkImportResult,
} from '../common/dto/bulk-import.dto';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { extractRow, type RowFieldSpec } from '../common/utils/csv-row.util';
import { httpErrorMessage } from '../common/utils/http-error-message.util';
import { ProjectsService } from '../projects/projects.service';
import { RequirementsRepository } from '../requirements/requirements.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateDefectDto } from './dto/create-defect.dto';
import type { UpdateDefectDto } from './dto/update-defect.dto';
import { toDefectSummary } from './defects.mapper';
import { DefectsRepository } from './defects.repository';

const IMPORT_FIELD_SPECS: RowFieldSpec[] = [
  { key: 'title', aliases: ['title'], required: true },
  { key: 'code', aliases: ['code'], required: true },
  { key: 'severity', aliases: ['severity'], default: 'Medium' },
  { key: 'priority', aliases: ['priority'], default: 'Medium' },
  { key: 'status', aliases: ['status'], default: 'New' },
  { key: 'description', aliases: ['description'] },
  { key: 'stepsToReproduce', aliases: ['stepstoreproduce', 'steps'] },
  { key: 'environment', aliases: ['environment'] },
  { key: 'requirementCode', aliases: ['requirementcode', 'requirement'] },
  { key: 'assigneeEmail', aliases: ['assigneeemail', 'assignee', 'assignedtoemail'] },
];

@Injectable()
export class DefectsService {
  constructor(
    private readonly defectsRepository: DefectsRepository,
    private readonly auditService: AuditService,
    private readonly projectsService: ProjectsService,
    private readonly requirementsRepository: RequirementsRepository,
    private readonly usersRepository: UsersRepository,
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

  async bulkImport(
    organizationId: string,
    dto: BulkImportDto,
    actor: AuthenticatedUser,
  ): Promise<BulkImportResult> {
    await this.projectsService.findOne(dto.projectId, organizationId);

    const [requirements, users] = await Promise.all([
      this.requirementsRepository.findAllForOrganization(organizationId),
      this.usersRepository.findManyByOrganization(organizationId),
    ]);
    const requirementIdByCode = new Map(
      requirements
        .filter((requirement) => requirement.projectId === dto.projectId)
        .map((requirement) => [requirement.code.toLowerCase(), requirement.id]),
    );
    const userIdByEmail = new Map(
      users.map((user) => [user.email.toLowerCase(), user.id]),
    );

    const errors: BulkImportResult['errors'] = [];
    let created = 0;

    for (let index = 0; index < dto.rows.length; index += 1) {
      const rowNumber = index + 2;
      try {
        const { values, errors: rowErrors } = extractRow(
          dto.rows[index],
          IMPORT_FIELD_SPECS,
        );
        if (rowErrors.length) throw new Error(rowErrors.join('; '));

        const { requirementCode, assigneeEmail, ...rest } = values;

        let requirementId: string | undefined;
        if (requirementCode) {
          requirementId = requirementIdByCode.get(requirementCode.toLowerCase());
          if (!requirementId) {
            throw new Error(
              `Requirement code "${requirementCode}" not found in this project`,
            );
          }
        }

        let assignedToId: string | undefined;
        if (assigneeEmail) {
          assignedToId = userIdByEmail.get(assigneeEmail.toLowerCase());
          if (!assignedToId) {
            throw new Error(
              `Assignee email "${assigneeEmail}" not found in this organization`,
            );
          }
        }

        const instance = plainToInstance(CreateDefectDto, {
          ...rest,
          projectId: dto.projectId,
          requirementId,
          assignedToId,
        });
        const violations = await validate(instance);
        if (violations.length) {
          throw new Error(
            violations
              .flatMap((violation) => Object.values(violation.constraints ?? {}))
              .join('; '),
          );
        }

        await this.create(organizationId, instance, actor);
        created += 1;
      } catch (error) {
        errors.push({ row: rowNumber, message: httpErrorMessage(error) });
      }
    }

    return { total: dto.rows.length, created, failed: errors.length, errors };
  }
}
