import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { ProjectsService } from '../projects/projects.service';
import type { CreateTestExecutionDto } from './dto/create-test-execution.dto';
import type { UpdateTestExecutionDto } from './dto/update-test-execution.dto';
import { toTestExecutionSummary } from './test-executions.mapper';
import { TestExecutionsRepository } from './test-executions.repository';

@Injectable()
export class TestExecutionsService {
  constructor(
    private readonly testExecutionsRepository: TestExecutionsRepository,
    private readonly auditService: AuditService,
    private readonly projectsService: ProjectsService,
  ) {}

  async list(organizationId: string) {
    const executions =
      await this.testExecutionsRepository.findAllForOrganization(
        organizationId,
      );
    return executions.map(toTestExecutionSummary);
  }

  async findOne(id: string, organizationId: string) {
    return toTestExecutionSummary(await this.findEntity(id, organizationId));
  }

  private async findEntity(id: string, organizationId: string) {
    const execution = await this.testExecutionsRepository.findById(id);
    if (!execution || execution.organizationId !== organizationId) {
      throw new NotFoundException('Test execution not found');
    }
    return execution;
  }

  async create(
    organizationId: string,
    dto: CreateTestExecutionDto,
    actor: AuthenticatedUser,
  ) {
    await this.projectsService.findOne(dto.projectId, organizationId);

    // A result other than "Not Run" means the case was actually executed —
    // stamp who ran it and when, the same moment the state enters that way.
    const isExecuted = Boolean(dto.result) && dto.result !== 'Not Run';

    try {
      const execution = await this.testExecutionsRepository.create(
        organizationId,
        {
          ...dto,
          executedById: isExecuted ? actor.id : undefined,
          executedAt: isExecuted
            ? dto.executedAt
              ? new Date(dto.executedAt)
              : new Date()
            : undefined,
        },
      );
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'TEST_EXECUTION_CREATED',
        entityType: 'TestExecution',
        entityId: execution.id,
        metadata: { code: execution.code, result: execution.result },
      });
      return toTestExecutionSummary(execution);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A test execution with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateTestExecutionDto,
    actor: AuthenticatedUser,
  ) {
    const existing = await this.findEntity(id, organizationId);
    if (dto.projectId && dto.projectId !== existing.projectId) {
      await this.projectsService.findOne(dto.projectId, organizationId);
    }

    const nextResult = dto.result ?? existing.result;
    const isNewlyExecuted =
      nextResult !== 'Not Run' && existing.result === 'Not Run';
    const isNoLongerExecuted =
      nextResult === 'Not Run' && existing.result !== 'Not Run';

    try {
      const execution = await this.testExecutionsRepository.update(id, {
        ...dto,
        executedById: isNewlyExecuted
          ? actor.id
          : isNoLongerExecuted
            ? null
            : undefined,
        executedAt: isNewlyExecuted
          ? dto.executedAt
            ? new Date(dto.executedAt)
            : new Date()
          : isNoLongerExecuted
            ? null
            : undefined,
      });
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'TEST_EXECUTION_UPDATED',
        entityType: 'TestExecution',
        entityId: id,
        metadata: { changes: dto },
      });
      return toTestExecutionSummary(execution);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A test execution with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string, actor: AuthenticatedUser) {
    const execution = await this.findOne(id, organizationId);

    await this.auditService.record({
      organizationId,
      userId: actor.id,
      action: 'TEST_EXECUTION_DELETED',
      entityType: 'TestExecution',
      entityId: id,
      metadata: { code: execution.code },
    });
    await this.testExecutionsRepository.delete(id);
  }
}
