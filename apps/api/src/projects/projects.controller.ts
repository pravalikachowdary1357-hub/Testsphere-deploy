import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Permissions('project:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.list(user.organizationId);
  }

  @Get(':id')
  @Permissions('project:read')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findOne(id, user.organizationId);
  }

  @Post()
  @Permissions('project:create')
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.create(user.organizationId, dto, user);
  }

  @Put(':id')
  @Permissions('project:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.update(id, user.organizationId, dto, user);
  }

  @Delete(':id')
  @Permissions('project:delete')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.delete(id, user.organizationId, user);
  }
}
