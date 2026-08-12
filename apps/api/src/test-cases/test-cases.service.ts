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
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import type { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { toTestCaseSummary } from './test-cases.mapper';
import { TestCasesRepository } from './test-cases.repository';

const IMPORT_FIELD_SPECS: RowFieldSpec[] = [
  { key: 'title', aliases: ['title'], required: true },
  { key: 'code', aliases: ['code'], required: true },
  { key: 'type', aliases: ['type'], default: 'Functional' },
  { key: 'priority', aliases: ['priority'], default: 'Medium' },
  { key: 'risk', aliases: ['risk'], default: 'Medium' },
  { key: 'status', aliases: ['status'], default: 'Draft' },
  { key: 'description', aliases: ['description'] },
  { key: 'preconditions', aliases: ['preconditions'] },
  { key: 'steps', aliases: ['steps'] },
  { key: 'expectedResult', aliases: ['expectedresult', 'expected'] },
  { key: 'testData', aliases: ['testdata'] },
  { key: 'tags', aliases: ['tags'] },
  { key: 'requirementCode', aliases: ['requirementcode', 'requirement'] },
];

@Injectable()
export class TestCasesService {
  constructor(
    private readonly testCasesRepository: TestCasesRepository,
    private readonly auditService: AuditService,
    private readonly projectsService: ProjectsService,
    private readonly requirementsRepository: RequirementsRepository,
  ) {}

  async list(organizationId: string) {
    const testCases =
      await this.testCasesRepository.findAllForOrganization(organizationId);
    return testCases.map(toTestCaseSummary);
  }

  async findOne(id: string, organizationId: string) {
    return toTestCaseSummary(await this.findEntity(id, organizationId));
  }

  // Raw Prisma record, for internal use where the caller needs fields (like
  // the current status/version) that toTestCaseSummary already flattened.
  private async findEntity(id: string, organizationId: string) {
    const testCase = await this.testCasesRepository.findById(id);
    if (!testCase || testCase.organizationId !== organizationId) {
      throw new NotFoundException('Test case not found');
    }
    return testCase;
  }

  async create(
    organizationId: string,
    dto: CreateTestCaseDto,
    actor: AuthenticatedUser,
  ) {
    await this.projectsService.findOne(dto.projectId, organizationId);

    try {
      const testCase = await this.testCasesRepository.create(
        organizationId,
        dto,
        actor.id,
      );
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'TEST_CASE_CREATED',
        entityType: 'TestCase',
        entityId: testCase.id,
        metadata: { title: testCase.title, code: testCase.code },
      });
      return toTestCaseSummary(testCase);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A test case with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateTestCaseDto,
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
      const testCase = await this.testCasesRepository.update(id, {
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
        action: 'TEST_CASE_UPDATED',
        entityType: 'TestCase',
        entityId: id,
        metadata: { changes: dto },
      });
      return toTestCaseSummary(testCase);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A test case with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string, actor: AuthenticatedUser) {
    const testCase = await this.findOne(id, organizationId);

    await this.auditService.record({
      organizationId,
      userId: actor.id,
      action: 'TEST_CASE_DELETED',
      entityType: 'TestCase',
      entityId: id,
      metadata: { title: testCase.title, code: testCase.code },
    });
    await this.testCasesRepository.delete(id);
  }

  async bulkImport(
    organizationId: string,
    dto: BulkImportDto,
    actor: AuthenticatedUser,
  ): Promise<BulkImportResult> {
    await this.projectsService.findOne(dto.projectId, organizationId);

    const requirements =
      await this.requirementsRepository.findAllForOrganization(organizationId);
    const requirementIdByCode = new Map(
      requirements
        .filter((requirement) => requirement.projectId === dto.projectId)
        .map((requirement) => [requirement.code.toLowerCase(), requirement.id]),
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

        const { requirementCode, ...rest } = values;
        let requirementId: string | undefined;
        if (requirementCode) {
          requirementId = requirementIdByCode.get(requirementCode.toLowerCase());
          if (!requirementId) {
            throw new Error(
              `Requirement code "${requirementCode}" not found in this project`,
            );
          }
        }

        const instance = plainToInstance(CreateTestCaseDto, {
          ...rest,
          projectId: dto.projectId,
          requirementId,
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
