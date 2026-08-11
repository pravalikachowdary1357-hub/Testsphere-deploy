import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { ProjectsService } from '../projects/projects.service';
import type { CreateTestPlanDto } from './dto/create-test-plan.dto';
import type { UpdateTestPlanDto } from './dto/update-test-plan.dto';
import { toTestPlanSummary } from './test-plans.mapper';
import { TestPlansRepository } from './test-plans.repository';

@Injectable()
export class TestPlansService {
  constructor(
    private readonly testPlansRepository: TestPlansRepository,
    private readonly auditService: AuditService,
    private readonly projectsService: ProjectsService,
  ) {}

  async list(organizationId: string) {
    const testPlans =
      await this.testPlansRepository.findAllForOrganization(organizationId);
    return testPlans.map(toTestPlanSummary);
  }

  async findOne(id: string, organizationId: string) {
    return toTestPlanSummary(await this.findEntity(id, organizationId));
  }

  // Raw Prisma record, for internal use where the caller needs fields (like
  // the current status/version) that toTestPlanSummary already flattened.
  private async findEntity(id: string, organizationId: string) {
    const testPlan = await this.testPlansRepository.findById(id);
    if (!testPlan || testPlan.organizationId !== organizationId) {
      throw new NotFoundException('Test plan not found');
    }
    return testPlan;
  }

  async create(
    organizationId: string,
    dto: CreateTestPlanDto,
    actor: AuthenticatedUser,
  ) {
    await this.projectsService.findOne(dto.projectId, organizationId);

    try {
      const testPlan = await this.testPlansRepository.create(
        organizationId,
        dto,
        actor.id,
      );
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'TEST_PLAN_CREATED',
        entityType: 'TestPlan',
        entityId: testPlan.id,
        metadata: { title: testPlan.title, code: testPlan.code },
      });
      return toTestPlanSummary(testPlan);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A test plan with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateTestPlanDto,
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
      const testPlan = await this.testPlansRepository.update(id, {
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
        action: 'TEST_PLAN_UPDATED',
        entityType: 'TestPlan',
        entityId: id,
        metadata: { changes: dto },
      });
      return toTestPlanSummary(testPlan);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A test plan with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string, actor: AuthenticatedUser) {
    const testPlan = await this.findOne(id, organizationId);

    await this.auditService.record({
      organizationId,
      userId: actor.id,
      action: 'TEST_PLAN_DELETED',
      entityType: 'TestPlan',
      entityId: id,
      metadata: { title: testPlan.title, code: testPlan.code },
    });
    await this.testPlansRepository.delete(id);
  }
}
