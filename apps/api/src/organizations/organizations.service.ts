import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { UsersService } from '../users/users.service';
import type { AssignOrganizationAdminDto } from './dto/assign-organization-admin.dto';
import type { CreateOrganizationDto } from './dto/create-organization.dto';
import type { UpdateOrganizationDto } from './dto/update-organization.dto';
import { toOrganizationSummary } from './organizations.mapper';
import { OrganizationsRepository } from './organizations.repository';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  async list() {
    const organizations = await this.organizationsRepository.findAll();
    return organizations.map(toOrganizationSummary);
  }

  async findOne(id: string) {
    const organization = await this.organizationsRepository.findById(id);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return toOrganizationSummary(organization);
  }

  async create(dto: CreateOrganizationDto, actor: AuthenticatedUser) {
    try {
      const organization = await this.organizationsRepository.create(dto);
      await this.auditService.record({
        organizationId: organization.id,
        userId: actor.id,
        action: 'ORGANIZATION_CREATED',
        entityType: 'Organization',
        entityId: organization.id,
        metadata: { name: organization.name, code: organization.code },
      });
      return toOrganizationSummary(organization);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An organization with this code already exists',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    actor: AuthenticatedUser,
  ) {
    await this.findOne(id);
    try {
      const organization = await this.organizationsRepository.update(id, dto);
      await this.auditService.record({
        organizationId: id,
        userId: actor.id,
        action: 'ORGANIZATION_UPDATED',
        entityType: 'Organization',
        entityId: id,
        metadata: { changes: dto },
      });
      return toOrganizationSummary(organization);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An organization with this code already exists',
        );
      }
      throw error;
    }
  }

  async listUsers(id: string) {
    await this.findOne(id);
    return this.usersService.listForOrganization(id);
  }

  async assignAdmin(
    id: string,
    dto: AssignOrganizationAdminDto,
    actor: AuthenticatedUser,
  ) {
    await this.findOne(id);
    const user = await this.usersService.findOneInOrganization(dto.userId, id);

    const organization = await this.organizationsRepository.update(id, {
      adminName: user.fullName,
      adminEmail: user.email,
    });

    await this.auditService.record({
      organizationId: id,
      userId: actor.id,
      action: 'ORGANIZATION_ADMIN_ASSIGNED',
      entityType: 'Organization',
      entityId: id,
      metadata: { adminUserId: user.id, adminEmail: user.email },
    });

    return toOrganizationSummary(organization);
  }

  async delete(id: string, actor: AuthenticatedUser) {
    const organization = await this.findOne(id);
    // Checked up front rather than caught from the DB error: User.organizationId
    // is a required, RESTRICT-on-delete FK, so this is the one precondition
    // that reliably blocks the delete — check it directly instead of pattern
    // matching a raw Postgres connector error.
    if (organization.userCount > 0) {
      throw new BadRequestException(
        'Cannot delete an organization that still has users assigned to it',
      );
    }

    // Logged before deleting, not after: writing the log once the row is gone
    // would itself fail AuditLog's now-nullable-but-still-validated FK on insert.
    await this.auditService.record({
      organizationId: id,
      userId: actor.id,
      action: 'ORGANIZATION_DELETED',
      entityType: 'Organization',
      entityId: id,
      metadata: { name: organization.name, code: organization.code },
    });
    await this.organizationsRepository.delete(id);
  }
}
