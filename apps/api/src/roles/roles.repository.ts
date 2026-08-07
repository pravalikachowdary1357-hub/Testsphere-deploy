import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const roleWithPermissions = {
  permissions: { include: { permission: true } },
} as const;

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      include: roleWithPermissions,
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: roleWithPermissions,
    });
  }

  create(data: { name: string; description?: string }) {
    return this.prisma.role.create({ data, include: roleWithPermissions });
  }

  async replacePermissions(roleId: string, permissionIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
      return tx.role.findUniqueOrThrow({
        where: { id: roleId },
        include: roleWithPermissions,
      });
    });
  }

  delete(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }
}
