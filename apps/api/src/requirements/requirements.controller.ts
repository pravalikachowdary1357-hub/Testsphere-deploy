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
import { BulkImportDto } from '../common/dto/bulk-import.dto';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { RequirementsService } from './requirements.service';

@Controller('requirements')
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @Get()
  @Permissions('requirement:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.requirementsService.list(user.organizationId);
  }

  @Post('bulk-import')
  @Permissions('requirement:create')
  bulkImport(
    @Body() dto: BulkImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requirementsService.bulkImport(user.organizationId, dto, user);
  }

  @Get(':id')
  @Permissions('requirement:read')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.requirementsService.findOne(id, user.organizationId);
  }

  @Post()
  @Permissions('requirement:create')
  create(
    @Body() dto: CreateRequirementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requirementsService.create(user.organizationId, dto, user);
  }

  @Put(':id')
  @Permissions('requirement:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRequirementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.requirementsService.update(id, user.organizationId, dto, user);
  }

  @Delete(':id')
  @Permissions('requirement:delete')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.requirementsService.delete(id, user.organizationId, user);
  }
}
