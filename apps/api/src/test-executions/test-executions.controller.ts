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
import { CreateTestExecutionDto } from './dto/create-test-execution.dto';
import { UpdateTestExecutionDto } from './dto/update-test-execution.dto';
import { TestExecutionsService } from './test-executions.service';

@Controller('test-executions')
export class TestExecutionsController {
  constructor(
    private readonly testExecutionsService: TestExecutionsService,
  ) {}

  @Get()
  @Permissions('testexecution:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.testExecutionsService.list(user.organizationId);
  }

  @Get(':id')
  @Permissions('testexecution:read')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.testExecutionsService.findOne(id, user.organizationId);
  }

  @Post()
  @Permissions('testexecution:create')
  create(
    @Body() dto: CreateTestExecutionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.testExecutionsService.create(user.organizationId, dto, user);
  }

  @Put(':id')
  @Permissions('testexecution:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTestExecutionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.testExecutionsService.update(
      id,
      user.organizationId,
      dto,
      user,
    );
  }

  @Delete(':id')
  @Permissions('testexecution:delete')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.testExecutionsService.delete(id, user.organizationId, user);
  }
}
