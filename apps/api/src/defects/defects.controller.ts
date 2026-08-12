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
import { CreateDefectDto } from './dto/create-defect.dto';
import { UpdateDefectDto } from './dto/update-defect.dto';
import { DefectsService } from './defects.service';

@Controller('defects')
export class DefectsController {
  constructor(private readonly defectsService: DefectsService) {}

  @Get()
  @Permissions('defect:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.defectsService.list(user.organizationId);
  }

  @Post('bulk-import')
  @Permissions('defect:create')
  bulkImport(
    @Body() dto: BulkImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.defectsService.bulkImport(user.organizationId, dto, user);
  }

  @Get(':id')
  @Permissions('defect:read')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.defectsService.findOne(id, user.organizationId);
  }

  @Post()
  @Permissions('defect:create')
  create(
    @Body() dto: CreateDefectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.defectsService.create(user.organizationId, dto, user);
  }

  @Put(':id')
  @Permissions('defect:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDefectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.defectsService.update(id, user.organizationId, dto, user);
  }

  @Delete(':id')
  @Permissions('defect:delete')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.defectsService.delete(id, user.organizationId, user);
  }
}
