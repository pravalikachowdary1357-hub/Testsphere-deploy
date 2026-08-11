import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { ProjectsService } from '../projects/projects.service';
import type { CreateTestSuiteDto } from './dto/create-test-suite.dto';
import type { UpdateTestSuiteDto } from './dto/update-test-suite.dto';
import { toTestSuiteSummary } from './test-suites.mapper';
import { TestSuitesRepository } from './test-suites.repository';

@Injectable()
export class TestSuitesService {
  constructor(
    private readonly testSuitesRepository: TestSuitesRepository,
    private readonly auditService: AuditService,
    private readonly projectsService: ProjectsService,
  ) {}

  async list(organizationId: string) {
    const testSuites =
      await this.testSuitesRepository.findAllForOrganization(organizationId);
    return testSuites.map(toTestSuiteSummary);
  }

  async findOne(id: string, organizationId: string) {
    const testSuite = await this.testSuitesRepository.findById(id);
    if (!testSuite || testSuite.organizationId !== organizationId) {
      throw new NotFoundException('Test suite not found');
    }
    return toTestSuiteSummary(testSuite);
  }

  async create(
    organizationId: string,
    dto: CreateTestSuiteDto,
    actor: AuthenticatedUser,
  ) {
    await this.projectsService.findOne(dto.projectId, organizationId);

    try {
      const testSuite = await this.testSuitesRepository.create(
        organizationId,
        dto,
        actor.id,
      );
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'TEST_SUITE_CREATED',
        entityType: 'TestSuite',
        entityId: testSuite.id,
        metadata: { name: testSuite.name, code: testSuite.code },
      });
      return toTestSuiteSummary(testSuite);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A test suite with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateTestSuiteDto,
    actor: AuthenticatedUser,
  ) {
    const existing = await this.findOne(id, organizationId);
    if (dto.projectId && dto.projectId !== existing.projectId) {
      await this.projectsService.findOne(dto.projectId, organizationId);
    }

    try {
      const testSuite = await this.testSuitesRepository.update(id, dto);
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'TEST_SUITE_UPDATED',
        entityType: 'TestSuite',
        entityId: id,
        metadata: { changes: dto },
      });
      return toTestSuiteSummary(testSuite);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A test suite with this code already exists in this project',
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string, actor: AuthenticatedUser) {
    const testSuite = await this.findOne(id, organizationId);

    await this.auditService.record({
      organizationId,
      userId: actor.id,
      action: 'TEST_SUITE_DELETED',
      entityType: 'TestSuite',
      entityId: id,
      metadata: { name: testSuite.name, code: testSuite.code },
    });
    await this.testSuitesRepository.delete(id);
  }
}
