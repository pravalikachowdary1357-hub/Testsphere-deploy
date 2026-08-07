import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import {
  asJwtDuration,
  type AccessTokenPayload,
  type RefreshTokenPayload,
  type TokenPair,
} from './auth.types';
import { RefreshTokenRepository } from './refresh-token.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(email: string, password: string) {
    const context = await this.usersService.getAuthContextByEmail(email);

    if (!context || !context.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      context.passwordHash,
    );
    if (!passwordMatches) {
      await this.auditService.record({
        organizationId: context.user.organizationId,
        userId: context.user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: context.user.id,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokenPair(
      context.user.id,
      context.user.email,
    );

    await this.auditService.record({
      organizationId: context.user.organizationId,
      userId: context.user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: context.user.id,
    });

    return { user: context.user, ...tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const storedToken = await this.refreshTokenRepository.findById(payload.jti);
    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException(
        'Refresh token is invalid or has expired',
      );
    }

    // Rotate: the presented token is single-use, so revoke it before issuing a new pair.
    await this.refreshTokenRepository.revoke(storedToken.id);

    const user = await this.usersService.getAuthContextById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists or is inactive');
    }

    return this.issueTokenPair(user.id, user.email);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.refreshTokenRepository.revoke(payload.jti);
    } catch {
      // Logout is idempotent: an already-invalid/expired token is not an error.
    }
  }

  async forgotPassword(email: string): Promise<{ devResetToken?: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Same response whether or not the account exists, so this endpoint
      // can't be used to enumerate registered emails.
      return {};
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await this.usersService.setPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.id,
    });

    const webOrigin = this.configService
      .get<string>('WEB_ORIGIN', 'http://localhost:5173')
      .split(',')[0];
    const resetUrl = `${webOrigin}/reset-password?token=${token}`;
    // No email transport is configured yet, so the only way to deliver this
    // link today is to log it — real delivery is a follow-up, not this endpoint's job.
    console.log(`[password reset] ${email} -> ${resetUrl}`);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    return isProduction ? {} : { devResetToken: token };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashResetToken(token);
    const user = await this.usersService.findByValidResetTokenHash(tokenHash);
    if (!user) {
      throw new BadRequestException(
        'This reset link is invalid or has expired',
      );
    }

    await this.usersService.resetPassword(user.id, newPassword);
    await this.refreshTokenRepository.revokeAllForUser(user.id);

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: user.id,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.getAuthContextById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists or is inactive');
    }

    await this.usersService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
    // The password just changed, so every other session's refresh token is revoked;
    // the caller's own access token stays valid only until its short expiry lapses.
    await this.refreshTokenRepository.revokeAllForUser(userId);

    await this.auditService.record({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
    });
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Refresh token is invalid or has expired',
      );
    }
  }

  private async issueTokenPair(
    userId: string,
    email: string,
  ): Promise<TokenPair> {
    const accessPayload: AccessTokenPayload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: asJwtDuration(
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      ),
    });

    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const refreshTokenRow = await this.refreshTokenRepository.create(
      userId,
      addDuration(new Date(), refreshExpiresIn),
    );

    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      jti: refreshTokenRow.id,
    };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: asJwtDuration(refreshExpiresIn),
    });

    return { accessToken, refreshToken };
  }
}

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

// The raw token is only ever emailed/logged, never stored — this is what actually
// sits in the DB, so a read of the User table alone can't be replayed as a valid token.
function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Minimal "1d/15m/7d"-style duration parser, matching what JWT_*_EXPIRES_IN already uses,
// so the RefreshToken row's expiresAt stays in sync with the JWT's own exp claim.
function addDuration(from: Date, duration: string): Date {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }
  const value = Number(match[1]);
  const unitMs: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return new Date(from.getTime() + value * unitMs[match[2]]);
}
