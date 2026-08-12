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
import { CreateRequirementDto } from './dto/create-requirement.dto';
import type { UpdateRequirementDto } from './dto/update-requirement.dto';
import { toRequirementSummary } from './requirements.mapper';
import { RequirementsRepository } from './requirements.repository';

const IMPORT_FIELD_SPECS: RowFieldSpec[] = [
  { key: 'title', aliases: ['title'], required: true },
  { key: 'code', aliases: ['code'], required: true },
  { key: 'type', aliases: ['type'], default: 'Functional' },
  { key: 'priority', aliases: ['priority'], default: 'Medium' },
  { key: 'status', aliases: ['status'], default: 'Draft' },
  { key: 'description', aliases: ['description'] },
];

@Injectable()
export class RequirementsService {
  constructor(
    private readonly requirementsRepository: RequirementsRepository,
    private readonly auditService: AuditService,
    private readonly projectsService: ProjectsService,
  ) {}

  async list(organizationId: string) {
    const requirements =
      await this.requirementsRepository.findAllForOrganization(
        organizationId,
      );
    return requirements.map(toRequirementSummary);
  }

  async findOne(id: string, organizationId: string) {
    return toRequirementSummary(
      await this.findEntity(id, organizationId),
    );
  }

  // Raw Prisma record, for internal use where the caller needs fields (like
  // the current status/version) that toRequirementSummary already flattened.
  private async findEntity(id: string, organizationId: string) {
    const requirement = await this.requirementsRepository.findById(id);
    if (!requirement || requirement.organizationId !== organizationId) {
      throw new NotFoundException('Requirement not found');
    }
    return requirement;
  }

  async create(
    organizationId: string,
    dto: CreateRequirementDto,
    actor: AuthenticatedUser,
  ) {
    await this.projectsService.findOne(dto.projectId, organizationId);

    try {
      const requirement = await this.requirementsRepository.create(
        organizationId,
        dto,
        actor.id,
      );
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'REQUIREMENT_CREATED',
        entityType: 'Requirement',
        entityId: requirement.id,
        metadata: { title: requirement.title, code: requirement.code },
      });
      return toRequirementSummary(requirement);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A requirement with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateRequirementDto,
    actor: AuthenticatedUser,
  ) {
    const existing = await this.findEntity(id, organizationId);
    if (dto.projectId && dto.projectId !== existing.projectId) {
      await this.projectsService.findOne(dto.projectId, organizationId);
    }

    // "Approved" carries who approved it and when — stamp that the moment
    // status transitions in, and clear it the moment status moves back out,
    // so an approval always reflects the current state, not a stale one.
    const nextStatus = dto.status ?? existing.status;
    const isNewlyApproved =
      nextStatus === 'Approved' && existing.status !== 'Approved';
    const isNoLongerApproved =
      nextStatus !== 'Approved' && existing.status === 'Approved';

    try {
      const requirement = await this.requirementsRepository.update(id, {
        ...dto,
        version: existing.version + 1,
        approvedById: isNewlyApproved
          ? actor.id
          : isNoLongerApproved
            ? null
            : undefined,
        approvedAt: isNewlyApproved
          ? new Date()
          : isNoLongerApproved
            ? null
            : undefined,
      });
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'REQUIREMENT_UPDATED',
        entityType: 'Requirement',
        entityId: id,
        metadata: { changes: dto },
      });
      return toRequirementSummary(requirement);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A requirement with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string, actor: AuthenticatedUser) {
    const requirement = await this.findOne(id, organizationId);

    await this.auditService.record({
      organizationId,
      userId: actor.id,
      action: 'REQUIREMENT_DELETED',
      entityType: 'Requirement',
      entityId: id,
      metadata: { title: requirement.title, code: requirement.code },
    });
    await this.requirementsRepository.delete(id);
  }

  async bulkImport(
    organizationId: string,
    dto: BulkImportDto,
    actor: AuthenticatedUser,
  ): Promise<BulkImportResult> {
    await this.projectsService.findOne(dto.projectId, organizationId);

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

        const instance = plainToInstance(CreateRequirementDto, {
          ...values,
          projectId: dto.projectId,
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
