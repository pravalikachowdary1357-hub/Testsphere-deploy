import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import { RequirementsModule } from '../requirements/requirements.module';
import { UsersModule } from '../users/users.module';
import { DefectsController } from './defects.controller';
import { DefectsRepository } from './defects.repository';
import { DefectsService } from './defects.service';

@Module({
  imports: [AuditModule, ProjectsModule, RequirementsModule, UsersModule],
  controllers: [DefectsController],
  providers: [DefectsService, DefectsRepository],
  exports: [DefectsService, DefectsRepository],
})
export class DefectsModule {}
