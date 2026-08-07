import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AssignPermissionsDto } from './dto/assign-permissions.dto';
import type { CreateRoleDto } from './dto/create-role.dto';
import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  list() {
    return this.rolesRepository.findAll();
  }

  async findOne(id: string) {
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async create(dto: CreateRoleDto) {
    try {
      return await this.rolesRepository.create(dto);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Role "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto) {
    await this.findOne(roleId);
    try {
      return await this.rolesRepository.replacePermissions(
        roleId,
        dto.permissionIds,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException('One or more permissionIds are invalid');
      }
      throw error;
    }
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.rolesRepository.delete(id);
  }
}
