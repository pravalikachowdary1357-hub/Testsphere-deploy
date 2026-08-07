import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const userWithAccess = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} as const;

export type UserWithAccess = NonNullable<
  Awaited<ReturnType<UsersRepository['findByIdWithAccess']>>
>;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailWithAccess(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: userWithAccess,
    });
  }

  findByIdWithAccess(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: userWithAccess,
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findManyByOrganization(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    organizationId: string;
    roleIds: string[];
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        organizationId: data.organizationId,
        roles: {
          create: data.roleIds.map((roleId) => ({ roleId })),
        },
      },
      include: userWithAccess,
    });
  }

  setActive(id: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id }, data: { isActive } });
  }

  setPasswordResetToken(id: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });
  }

  findByValidResetTokenHash(tokenHash: string) {
    return this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });
  }

  updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
  }

  updateFullName(id: string, fullName: string) {
    return this.prisma.user.update({
      where: { id },
      data: { fullName },
      include: userWithAccess,
    });
  }
}
