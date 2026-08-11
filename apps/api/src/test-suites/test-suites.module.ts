import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import { TestSuitesController } from './test-suites.controller';
import { TestSuitesRepository } from './test-suites.repository';
import { TestSuitesService } from './test-suites.service';

@Module({
  imports: [AuditModule, ProjectsModule],
  controllers: [TestSuitesController],
  providers: [TestSuitesService, TestSuitesRepository],
  exports: [TestSuitesService, TestSuitesRepository],
})
export class TestSuitesModule {}
