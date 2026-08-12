import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import { RequirementsModule } from '../requirements/requirements.module';
import { TestCasesController } from './test-cases.controller';
import { TestCasesRepository } from './test-cases.repository';
import { TestCasesService } from './test-cases.service';

@Module({
  imports: [AuditModule, ProjectsModule, RequirementsModule],
  controllers: [TestCasesController],
  providers: [TestCasesService, TestCasesRepository],
  exports: [TestCasesService, TestCasesRepository],
})
export class TestCasesModule {}
