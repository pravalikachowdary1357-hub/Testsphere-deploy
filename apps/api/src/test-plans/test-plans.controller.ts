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
import { CreateTestPlanDto } from './dto/create-test-plan.dto';
import { UpdateTestPlanDto } from './dto/update-test-plan.dto';
import { TestPlansService } from './test-plans.service';

@Controller('test-plans')
export class TestPlansController {
  constructor(private readonly testPlansService: TestPlansService) {}

  @Get()
  @Permissions('testplan:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.testPlansService.list(user.organizationId);
  }

  @Get(':id')
  @Permissions('testplan:read')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.testPlansService.findOne(id, user.organizationId);
  }

  @Post()
  @Permissions('testplan:create')
  create(
    @Body() dto: CreateTestPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.testPlansService.create(user.organizationId, dto, user);
  }

  @Put(':id')
  @Permissions('testplan:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTestPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.testPlansService.update(id, user.organizationId, dto, user);
  }

  @Delete(':id')
  @Permissions('testplan:delete')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.testPlansService.delete(id, user.organizationId, user);
  }
}
