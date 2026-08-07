import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

const withOwner = {
  productOwner: { select: { id: true, fullName: true, email: true } },
} as const;

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForOrganization(organizationId: string) {
    return this.prisma.product.findMany({
      where: { organizationId },
      include: withOwner,
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: withOwner,
    });
  }

  create(organizationId: string, data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        version: data.version,
        status: data.status,
        productOwnerId: data.productOwnerId,
        organizationId,
      },
      include: withOwner,
    });
  }

  update(id: string, data: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        version: data.version,
        status: data.status,
        productOwnerId: data.productOwnerId,
      },
      include: withOwner,
    });
  }

  delete(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
