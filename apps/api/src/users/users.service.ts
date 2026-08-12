import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import { toAuthenticatedUser, toUserSummary } from './users.mapper';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async getAuthContextByEmail(email: string): Promise<{
    user: AuthenticatedUser;
    passwordHash: string;
    isActive: boolean;
  } | null> {
    const user = await this.usersRepository.findByEmailWithAccess(email);
    if (!user) {
      return null;
    }
    return {
      user: toAuthenticatedUser(user),
      passwordHash: user.passwordHash,
      isActive: user.isActive,
    };
  }

  async getAuthContextById(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.usersRepository.findByIdWithAccess(id);
    if (!user || !user.isActive) {
      return null;
    }
    return toAuthenticatedUser(user);
  }

  async create(
    dto: CreateUserDto,
    organizationId: string,
    actor: AuthenticatedUser,
  ) {
    const passwordHash = await this.hashPassword(dto.password);

    try {
      const user = await this.usersRepository.create({
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        organizationId,
        roleIds: dto.roleIds,
      });
      await this.auditService.record({
        organizationId,
        userId: actor.id,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        metadata: { email: user.email },
      });
      return toAuthenticatedUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A user with this email already exists');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('One or more roleIds are invalid');
        }
      }
      throw error;
    }
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const user = await this.usersRepository.findById(id);
    if (!user || user.organizationId !== organizationId) {
      throw new NotFoundException('User not found');
    }
    return toUserSummary(user);
  }

  async listForOrganization(organizationId: string) {
    const users =
      await this.usersRepository.findManyByOrganization(organizationId);
    return users.map(toUserSummary);
  }

  async deactivate(
    id: string,
    organizationId: string,
    actor: AuthenticatedUser,
  ) {
    if (id === actor.id) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    await this.findOneInOrganization(id, organizationId);
    const user = await this.usersRepository.setActive(id, false);
    await this.auditService.record({
      organizationId,
      userId: actor.id,
      action: 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email },
    });
    return toUserSummary(user);
  }

  async reactivate(
    id: string,
    organizationId: string,
    actor: AuthenticatedUser,
  ) {
    await this.findOneInOrganization(id, organizationId);
    const user = await this.usersRepository.setActive(id, true);
    await this.auditService.record({
      organizationId,
      userId: actor.id,
      action: 'USER_REACTIVATED',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email },
    });
    return toUserSummary(user);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    await this.usersRepository.setPasswordResetToken(
      userId,
      tokenHash,
      expiresAt,
    );
  }

  async findByValidResetTokenHash(tokenHash: string) {
    return this.usersRepository.findByValidResetTokenHash(tokenHash);
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await this.hashPassword(newPassword);
    await this.usersRepository.updatePassword(userId, passwordHash);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.usersRepository.updatePassword(userId, passwordHash);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.updateFullName(
      userId,
      dto.fullName,
    );
    return toAuthenticatedUser(user);
  }

  private async hashPassword(password: string): Promise<string> {
    // ConfigService.get<number>() doesn't coerce env vars — they're always strings
    // at runtime — so this must be parsed explicitly or bcrypt gets a string cost factor.
    const saltRounds = Number(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
    );
    return bcrypt.hash(password, saltRounds);
  }
}
