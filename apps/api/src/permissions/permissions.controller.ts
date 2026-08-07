import { Body, Controller, Get, Post } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions('permission:read')
  list() {
    return this.permissionsService.list();
  }

  @Post()
  @Permissions('permission:create')
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }
}
