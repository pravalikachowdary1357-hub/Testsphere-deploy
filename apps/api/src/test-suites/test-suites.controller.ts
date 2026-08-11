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
import { CreateTestSuiteDto } from './dto/create-test-suite.dto';
import { UpdateTestSuiteDto } from './dto/update-test-suite.dto';
import { TestSuitesService } from './test-suites.service';

@Controller('test-suites')
export class TestSuitesController {
  constructor(private readonly testSuitesService: TestSuitesService) {}

  @Get()
  @Permissions('testsuite:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.testSuitesService.list(user.organizationId);
  }

  @Get(':id')
  @Permissions('testsuite:read')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.testSuitesService.findOne(id, user.organizationId);
  }

  @Post()
  @Permissions('testsuite:create')
  create(
    @Body() dto: CreateTestSuiteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.testSuitesService.create(user.organizationId, dto, user);
  }

  @Put(':id')
  @Permissions('testsuite:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTestSuiteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.testSuitesService.update(id, user.organizationId, dto, user);
  }

  @Delete(':id')
  @Permissions('testsuite:delete')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.testSuitesService.delete(id, user.organizationId, user);
  }
}
