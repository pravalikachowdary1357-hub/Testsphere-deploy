import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionsRepository } from './permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  list() {
    return this.permissionsRepository.findAll();
  }

  async create(dto: CreatePermissionDto) {
    try {
      return await this.permissionsRepository.create(dto);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Permission "${dto.key}" already exists`);
      }
      throw error;
    }
  }
}
