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
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { TestCasesService } from './test-cases.service';

@Controller('test-cases')
export class TestCasesController {
  constructor(private readonly testCasesService: TestCasesService) {}

  @Get()
  @Permissions('testcase:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.testCasesService.list(user.organizationId);
  }

  @Post('bulk-import')
  @Permissions('testcase:create')
  bulkImport(
    @Body() dto: BulkImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.testCasesService.bulkImport(user.organizationId, dto, user);
  }

  @Get(':id')
  @Permissions('testcase:read')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.testCasesService.findOne(id, user.organizationId);
  }

  @Post()
  @Permissions('testcase:create')
  create(
    @Body() dto: CreateTestCaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.testCasesService.create(user.organizationId, dto, user);
  }

  @Put(':id')
  @Permissions('testcase:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTestCaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.testCasesService.update(id, user.organizationId, dto, user);
  }

  @Delete(':id')
  @Permissions('testcase:delete')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.testCasesService.delete(id, user.organizationId, user);
  }
}
