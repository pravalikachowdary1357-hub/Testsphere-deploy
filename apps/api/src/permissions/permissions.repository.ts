import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  create(data: { key: string; description?: string }) {
    return this.prisma.permission.create({ data });
  }
}
