import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { AuditService } from '../../common/services/audit.service';
import {
  accessSigningKey,
  jwtAlgorithm,
  refreshSigningKey,
} from '../../config/jwt-keys';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

import type { JwtPayload } from './auth.types';
import type { TestingModule } from '@nestjs/testing';

describe('AuthService', () => {
  let service: AuthService;
  let jwt: JwtService;

  const activeUser = {
    id: 'user-1',
    organizationId: 'org-1',
    email: 'user@test.com',
    fullName: 'Test User',
    role: 'employee' as const,
    isActive: true,
    deletedAt: null,
    passwordHash: 'hash',
  };

  const mockPrisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    organization: {
      findUnique: jest.Mock;
    };
    authRefreshSession: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      deleteMany: jest.Mock;
      delete: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  } = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue(activeUser),
    },
    organization: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'org-1',
        isActive: true,
        deletedAt: null,
      }),
    },
    authRefreshSession: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      delete: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'session-1' }),
    },
    $transaction: jest.fn(async (fn: (tx: typeof mockPrisma) => unknown) =>
      fn(mockPrisma),
    ),
  };

  const mockRedis = {
    isBlocklisted: jest.fn().mockResolvedValue(false),
    setBlocklist: jest.fn().mockResolvedValue(undefined),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET ??
      'test-access-secret-min-32-characters-long';
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET ??
      'test-refresh-secret-min-32-characters-long';
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(AuthService);
    jwt = module.get(JwtService);

    mockPrisma.user.findUnique.mockResolvedValue(activeUser);
  });

  function signRefreshToken(jti: string): string {
    const payload: JwtPayload = {
      sub: activeUser.id,
      org: activeUser.organizationId,
      role: activeUser.role,
      email: activeUser.email,
      jti,
      type: 'refresh',
    };
    return jwt.sign(payload, {
      secret: refreshSigningKey(),
      expiresIn: 3600,
      algorithm: jwtAlgorithm(),
    });
  }

  it('rotates refresh tokens when the active session is valid', async () => {
    const oldJti = 'refresh-jti-active';
    const refreshToken = signRefreshToken(oldJti);

    mockPrisma.authRefreshSession.findUnique.mockResolvedValue({
      id: 'session-row',
      refreshJti: oldJti,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const tokens = await service.refresh(refreshToken);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.refreshToken).not.toBe(refreshToken);
    expect(mockRedis.setBlocklist).toHaveBeenCalledWith(
      oldJti,
      expect.any(Number),
    );
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('detects refresh token replay and terminates the user sessions', async () => {
    const replayedJti = 'refresh-jti-replayed';
    const refreshToken = signRefreshToken(replayedJti);

    mockPrisma.authRefreshSession.findUnique.mockResolvedValue(null);
    mockPrisma.authRefreshSession.findFirst.mockResolvedValue({
      id: 'child-session',
      parentJti: replayedJti,
    });

    await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(mockPrisma.authRefreshSession.deleteMany).toHaveBeenCalledWith({
      where: { userId: activeUser.id },
    });
    expect(mockRedis.setBlocklist).toHaveBeenCalledWith(
      replayedJti,
      expect.any(Number),
    );
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'auth.replay_attack_detected' }),
    );
  });

  it('rejects refresh when the session is missing and no replay child exists', async () => {
    const staleJti = 'refresh-jti-stale';
    const refreshToken = signRefreshToken(staleJti);

    mockPrisma.authRefreshSession.findUnique.mockResolvedValue(null);
    mockPrisma.authRefreshSession.findFirst.mockResolvedValue(null);

    await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects revoked access tokens during verification', async () => {
    const payload: JwtPayload = {
      sub: activeUser.id,
      org: activeUser.organizationId,
      role: activeUser.role,
      email: activeUser.email,
      jti: 'blocked-access-jti',
      type: 'access',
    };
    const accessToken = jwt.sign(payload, {
      secret: accessSigningKey(),
      expiresIn: 3600,
      algorithm: jwtAlgorithm(),
    });

    mockRedis.isBlocklisted.mockResolvedValueOnce(true);

    await expect(service.verifyAccessToken(accessToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
