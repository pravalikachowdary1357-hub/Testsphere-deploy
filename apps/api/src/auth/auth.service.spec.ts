import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RefreshTokenRepository } from './refresh-token.repository';

const CONFIG: Record<string, string> = {
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: '7d',
};

function createConfigServiceMock() {
  return {
    get: jest.fn((key: string, fallback?: unknown) => CONFIG[key] ?? fallback),
    getOrThrow: jest.fn((key: string) => {
      const value = CONFIG[key];
      if (value === undefined) {
        throw new Error(`Missing config: ${key}`);
      }
      return value;
    }),
  } as unknown as ConfigService;
}

function createRefreshTokenRepositoryMock() {
  const rows = new Map<
    string,
    { id: string; userId: string; expiresAt: Date; revokedAt: Date | null }
  >();
  let counter = 0;

  return {
    rows,
    create: jest.fn((userId: string, expiresAt: Date) => {
      const id = `token-${++counter}`;
      const row = { id, userId, expiresAt, revokedAt: null as Date | null };
      rows.set(id, row);
      return row;
    }),
    findById: jest.fn((id: string) => rows.get(id) ?? null),
    revoke: jest.fn((id: string) => {
      const row = rows.get(id);
      if (row) {
        row.revokedAt = new Date();
      }
      return row;
    }),
  } as unknown as RefreshTokenRepository & { rows: Map<string, unknown> };
}

describe('AuthService', () => {
  const USER_ID = 'user-1';
  const EMAIL = 'tester@example.com';
  const PASSWORD = 'correct-password';

  let passwordHash: string;
  let usersService: {
    getAuthContextByEmail: jest.Mock;
    getAuthContextById: jest.Mock;
  };
  let auditService: { record: jest.Mock };
  let refreshTokenRepository: ReturnType<
    typeof createRefreshTokenRepositoryMock
  >;
  let authService: AuthService;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  beforeEach(() => {
    usersService = {
      getAuthContextByEmail: jest.fn(),
      getAuthContextById: jest.fn(),
    };
    auditService = { record: jest.fn() };
    refreshTokenRepository = createRefreshTokenRepositoryMock();

    authService = new AuthService(
      usersService as unknown as UsersService,
      refreshTokenRepository,
      new JwtService(),
      createConfigServiceMock(),
      auditService as unknown as AuditService,
    );
  });

  const authenticatedUser = {
    id: USER_ID,
    email: EMAIL,
    fullName: 'Test User',
    organizationId: 'org-1',
    roles: ['Tester'],
    permissions: ['user:read'],
  };

  describe('login', () => {
    it('returns tokens and the user on valid credentials', async () => {
      usersService.getAuthContextByEmail.mockResolvedValue({
        user: authenticatedUser,
        passwordHash,
        isActive: true,
      });

      const result = await authService.login(EMAIL, PASSWORD);

      expect(result.user).toEqual(authenticatedUser);
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN', userId: USER_ID }),
      );
    });

    it('rejects an unknown email', async () => {
      usersService.getAuthContextByEmail.mockResolvedValue(null);

      await expect(authService.login(EMAIL, PASSWORD)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an inactive user', async () => {
      usersService.getAuthContextByEmail.mockResolvedValue({
        user: authenticatedUser,
        passwordHash,
        isActive: false,
      });

      await expect(authService.login(EMAIL, PASSWORD)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password and records LOGIN_FAILED', async () => {
      usersService.getAuthContextByEmail.mockResolvedValue({
        user: authenticatedUser,
        passwordHash,
        isActive: true,
      });

      await expect(
        authService.login(EMAIL, 'wrong-password'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_FAILED', userId: USER_ID }),
      );
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token and issues a new pair', async () => {
      usersService.getAuthContextByEmail.mockResolvedValue({
        user: authenticatedUser,
        passwordHash,
        isActive: true,
      });
      usersService.getAuthContextById.mockResolvedValue(authenticatedUser);

      const { refreshToken } = await authService.login(EMAIL, PASSWORD);
      const rotated = await authService.refresh(refreshToken);

      expect(typeof rotated.accessToken).toBe('string');
      expect(typeof rotated.refreshToken).toBe('string');
      expect(rotated.refreshToken).not.toBe(refreshToken);

      // The original refresh token must now be rejected (single-use / rotation).
      await expect(authService.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a garbage token', async () => {
      await expect(authService.refresh('not-a-jwt')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('revokes a valid refresh token', async () => {
      usersService.getAuthContextByEmail.mockResolvedValue({
        user: authenticatedUser,
        passwordHash,
        isActive: true,
      });

      const { refreshToken } = await authService.login(EMAIL, PASSWORD);
      await authService.logout(refreshToken);

      await expect(authService.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('does not throw for an already-invalid token', async () => {
      await expect(authService.logout('not-a-jwt')).resolves.toBeUndefined();
    });
  });
});
