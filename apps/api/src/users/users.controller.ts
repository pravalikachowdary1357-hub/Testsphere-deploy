import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() currentUser: AuthenticatedUser) {
    return currentUser;
  }

  @Patch('me')
  updateMe(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.updateProfile(currentUser.id, dto);
  }

  @Get()
  @Permissions('user:read')
  list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.listForOrganization(currentUser.organizationId);
  }

  @Post()
  @Permissions('user:create')
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.create(
      dto,
      currentUser.organizationId,
      currentUser,
    );
  }

  @Get(':id')
  @Permissions('user:read')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.findOneInOrganization(
      id,
      currentUser.organizationId,
    );
  }

  @Delete(':id')
  @Permissions('user:delete')
  deactivate(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.deactivate(
      id,
      currentUser.organizationId,
      currentUser,
    );
  }

  @Patch(':id/reactivate')
  @Permissions('user:update')
  reactivate(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.reactivate(
      id,
      currentUser.organizationId,
      currentUser,
    );
  }
}
