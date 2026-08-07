import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { UsersService } from '../users/users.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { toProductSummary } from './products.mapper';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  async list(organizationId: string) {
    const products =
      await this.productsRepository.findAllForOrganization(organizationId);
    return products.map(toProductSummary);
  }

  async findOne(id: string, organizationId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.organizationId !== organizationId) {
      throw new NotFoundException('Product not found');
    }
    return toProductSummary(product);
  }

  async create(
    organizationId: string,
    dto: CreateProductDto,
    actor: AuthenticatedUser,
  ) {
    if (dto.productOwnerId) {
      await this.usersService.findOneInOrganization(
        dto.productOwnerId,
        organizationId,
      );
    }

    try {
      const product = await this.productsRepository.create(organizationId, dto);
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'PRODUCT_CREATED',
        entityType: 'Product',
        entityId: product.id,
        metadata: { name: product.name, code: product.code },
      });
      return toProductSummary(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A product with this code already exists in this organization',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    dto: UpdateProductDto,
    actor: AuthenticatedUser,
  ) {
    await this.findOne(id, organizationId);
    if (dto.productOwnerId) {
      await this.usersService.findOneInOrganization(
        dto.productOwnerId,
        organizationId,
      );
    }

    try {
      const product = await this.productsRepository.update(id, dto);
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'PRODUCT_UPDATED',
        entityType: 'Product',
        entityId: id,
        metadata: { changes: dto },
      });
      return toProductSummary(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A product with this code already exists in this organization',
        );
      }
      throw error;
    }
  }

  async delete(id: string, organizationId: string, actor: AuthenticatedUser) {
    const product = await this.findOne(id, organizationId);

    await this.auditService.record({
      organizationId,
      userId: actor.id,
      action: 'PRODUCT_DELETED',
      entityType: 'Product',
      entityId: id,
      metadata: { name: product.name, code: product.code },
    });
    await this.productsRepository.delete(id);
  }
}
