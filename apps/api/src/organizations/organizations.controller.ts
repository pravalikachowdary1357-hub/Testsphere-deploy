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
import { AssignOrganizationAdminDto } from './dto/assign-organization-admin.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Permissions('organization:read')
  list() {
    return this.organizationsService.list();
  }

  @Get(':id')
  @Permissions('organization:read')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get(':id/users')
  @Permissions('organization:read')
  listUsers(@Param('id') id: string) {
    return this.organizationsService.listUsers(id);
  }

  @Post()
  @Permissions('organization:create')
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.create(dto, user);
  }

  @Put(':id')
  @Permissions('organization:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.update(id, dto, user);
  }

  @Put(':id/admin')
  @Permissions('organization:update')
  assignAdmin(
    @Param('id') id: string,
    @Body() dto: AssignOrganizationAdminDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.assignAdmin(id, dto, user);
  }

  @Delete(':id')
  @Permissions('organization:delete')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.delete(id, user);
  }
}
