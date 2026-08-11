import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import { TestExecutionsController } from './test-executions.controller';
import { TestExecutionsRepository } from './test-executions.repository';
import { TestExecutionsService } from './test-executions.service';

@Module({
  imports: [AuditModule, ProjectsModule],
  controllers: [TestExecutionsController],
  providers: [TestExecutionsService, TestExecutionsRepository],
  exports: [TestExecutionsService, TestExecutionsRepository],
})
export class TestExecutionsModule {}
