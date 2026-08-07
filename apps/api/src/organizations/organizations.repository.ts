import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOrganizationDto } from './dto/create-organization.dto';
import type { UpdateOrganizationDto } from './dto/update-organization.dto';

const withUserCount = {
  _count: { select: { users: true } },
} as const;

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.organization.findMany({
      include: withUserCount,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: withUserCount,
    });
  }

  create(data: CreateOrganizationDto) {
    return this.prisma.organization.create({ data, include: withUserCount });
  }

  update(id: string, data: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id },
      data,
      include: withUserCount,
    });
  }

  delete(id: string) {
    return this.prisma.organization.delete({ where: { id } });
  }
}
