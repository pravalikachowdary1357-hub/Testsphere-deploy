import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { ProjectsService } from '../projects/projects.service';
import type { CreateTestCaseDto } from './dto/create-test-case.dto';
import type { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { toTestCaseSummary } from './test-cases.mapper';
import { TestCasesRepository } from './test-cases.repository';

@Injectable()
export class TestCasesService {
  constructor(
    private readonly testCasesRepository: TestCasesRepository,
    private readonly auditService: AuditService,
    private readonly projectsService: ProjectsService,
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
}
