import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import { TestPlansController } from './test-plans.controller';
import { TestPlansRepository } from './test-plans.repository';
import { TestPlansService } from './test-plans.service';

@Module({
  imports: [AuditModule, ProjectsModule],
  controllers: [TestPlansController],
  providers: [TestPlansService, TestPlansRepository],
  exports: [TestPlansService, TestPlansRepository],
})
export class TestPlansModule {}
