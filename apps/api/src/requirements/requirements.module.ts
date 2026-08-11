import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import { RequirementsController } from './requirements.controller';
import { RequirementsRepository } from './requirements.repository';
import { RequirementsService } from './requirements.service';

@Module({
  imports: [AuditModule, ProjectsModule],
  controllers: [RequirementsController],
  providers: [RequirementsService, RequirementsRepository],
  exports: [RequirementsService, RequirementsRepository],
})
export class RequirementsModule {}
