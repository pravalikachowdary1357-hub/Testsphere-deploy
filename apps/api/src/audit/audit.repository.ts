import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRecent(limit = DEFAULT_LIMIT) {
    return this.prisma.auditLog.findMany({
      take: Math.min(limit, MAX_LIMIT),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, email: true } } },
    });
  }
}
