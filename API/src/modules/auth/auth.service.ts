import {
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import {
  accessSigningKey,
  accessVerificationKey,
  jwtAlgorithm,
  refreshSigningKey,
  refreshVerificationKey,
} from '../../config/jwt-keys';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AuditService } from '../../common/services/audit.service';
import type { UserRole } from '@prisma/client';
import type { JwtPayload, RequestUser } from './auth.types';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

export interface AuthUserDto {
  id: string;
  organizationId?: string | null;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  organizationName?: string;
  createdAt?: Date;
  cardsScanned?: number;
}

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  private get accessTtlSeconds(): number {
    return Number.parseInt(process.env.JWT_ACCESS_TTL_SECONDS ?? '3600', 10);
  }

  private get refreshTtlSeconds(): number {
    return Number.parseInt(
      process.env.JWT_REFRESH_TTL_SECONDS ?? '2592000',
      10,
    );
  }

  private toRequestUser(payload: JwtPayload, organizationId?: string | null): RequestUser {
    return {
      id: payload.sub,
      organizationId: organizationId || undefined,
      role: payload.role,
      email: payload.email,
      jti: payload.jti,
    };
  }

  private signAccessToken(user: {
    id: string;
    organizationId?: string | null;
    role: UserRole;
    email: string;
  }): { token: string; jti: string; expiresIn: number } {
    const jti = randomUUID();
    const expiresIn = this.accessTtlSeconds;
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      jti,
      type: 'access',
    };
    const token = this.jwt.sign(payload, {
      secret: accessSigningKey(),
      expiresIn,
      algorithm: jwtAlgorithm(),
    });
    return { token, jti, expiresIn };
  }

  private signRefreshToken(user: {
    id: string;
    organizationId?: string | null;
    role: UserRole;
    email: string;
  }): { token: string; jti: string } {
    const jti = randomUUID();
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      jti,
      type: 'refresh',
    };
    const token = this.jwt.sign(payload, {
      secret: refreshSigningKey(),
      expiresIn: this.refreshTtlSeconds,
      algorithm: jwtAlgorithm(),
    });
    return { token, jti };
  }

  async verifyAccessToken(token: string): Promise<RequestUser> {
    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: accessVerificationKey(),
        algorithms: [jwtAlgorithm()],
      });
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }
      if (await this.redis.isBlocklisted(payload.jti)) {
        throw new UnauthorizedException('Token revoked');
      }
      const dbUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { organizationId: true },
      });
      return this.toRequestUser(payload, dbUser?.organizationId);
    } catch (e) {
      this.logger.error('verifyAccessToken error details:', e);
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: refreshVerificationKey(),
        algorithms: [jwtAlgorithm()],
      });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      if (await this.redis.isBlocklisted(payload.jti)) {
        throw new UnauthorizedException('Refresh token revoked');
      }
      return payload;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private mapUser(user: {
    id: string;
    organizationId?: string | null;
    email: string;
    fullName: string | null;
    role: UserRole;
    isActive: boolean;
  }): AuthUserDto {
    return {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    };
  }

  private async assertUserOrgActive(organizationId?: string | null): Promise<void> {
    if (!organizationId) return;
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org || !org.isActive || org.deletedAt) {
      throw new ForbiddenException('Organization is inactive');
    }
  }

  private async issueTokens(
    user: {
      id: string;
      organizationId?: string | null;
      role: UserRole;
      email: string;
    },
    parentJti?: string,
  ): Promise<TokenPairDto> {
    await this.assertUserOrgActive(user.organizationId);

    const access = this.signAccessToken(user);
    const refresh = this.signRefreshToken(user);
    const expiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);

    if (parentJti) {
      // Rotate active session in a transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.authRefreshSession.deleteMany({
          where: { refreshJti: parentJti },
        });
        await tx.authRefreshSession.create({
          data: {
            userId: user.id,
            refreshJti: refresh.jti,
            parentJti,
            expiresAt,
          },
        });
      });
    } else {
      // New session login
      await this.prisma.authRefreshSession.create({
        data: {
          userId: user.id,
          refreshJti: refresh.jti,
          expiresAt,
        },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      expiresIn: access.expiresIn,
    };
  }

  async register(
    dto: import('./dto/register.dto').RegisterDto,
    meta?: { ipAddress?: string; correlationId?: string },
  ): Promise<{ user: AuthUserDto; tokens: TokenPairDto }> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ForbiddenException('User already exists');
    }

    const passwordHash = await AuthService.hashPassword(dto.password);

    const orgName = `${dto.fullName || 'User'}'s Vault`;
    const orgSlug = `vault-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const user = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgSlug,
          plan: 'free',
        },
      });

      return tx.user.create({
        data: {
          email,
          fullName: dto.fullName,
          passwordHash,
          role: 'user',
          organizationId: org.id,
          isActive: true,
        },
      });
    });

    const tokens = await this.issueTokens(user);
    await this.audit.log({
      actorId: user.id,
      actorRole: user.role,
      eventType: 'auth.register.success',
      entityType: 'user',
      entityId: user.id,
      ipAddress: meta?.ipAddress,
      correlationId: meta?.correlationId,
    });
    return { user: this.mapUser(user), tokens };
  }

  async login(
    dto: LoginDto,
    meta?: { ipAddress?: string; correlationId?: string },
  ): Promise<{ user: AuthUserDto; tokens: TokenPairDto }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash || user.deletedAt || !user.isActive) {
      await this.audit.log({
        eventType: 'auth.login.failed',
        entityType: 'user',
        eventData: { email },
        ipAddress: meta?.ipAddress,
        correlationId: meta?.correlationId,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.assertUserOrgActive(user.organizationId);

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.audit.log({
        organizationId: user.organizationId,
        eventType: 'auth.login.failed',
        entityType: 'user',
        entityId: user.id,
        eventData: { email },
        ipAddress: meta?.ipAddress,
        correlationId: meta?.correlationId,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user);
    await this.audit.log({
      organizationId: user.organizationId,
      actorId: user.id,
      actorRole: user.role,
      eventType: 'auth.login.success',
      entityType: 'user',
      entityId: user.id,
      ipAddress: meta?.ipAddress,
      correlationId: meta?.correlationId,
    });
    return { user: this.mapUser(user), tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPairDto> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.deletedAt || !user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    const session = await this.prisma.authRefreshSession.findUnique({
      where: { refreshJti: payload.jti },
    });

    if (!session) {
      // Token used but not active in DB. Check for replay attack.
      const replayed = await this.prisma.authRefreshSession.findFirst({
        where: { parentJti: payload.jti },
      });

      if (replayed) {
        // Replay attack! Invalidate all sessions for this user.
        await this.prisma.authRefreshSession.deleteMany({
          where: { userId: user.id },
        });
        await this.redis.setBlocklist(payload.jti, this.refreshTtlSeconds);

        await this.audit.log({
          organizationId: user.organizationId,
          actorId: user.id,
          actorRole: user.role,
          eventType: 'auth.replay_attack_detected',
          entityType: 'user',
          entityId: user.id,
          eventData: { jti: payload.jti },
        });

        throw new ForbiddenException(
          'Security alert: Refresh token already used. Session terminated.',
        );
      }

      throw new UnauthorizedException('Refresh session expired');
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.authRefreshSession.delete({
        where: { id: session.id },
      });
      throw new UnauthorizedException('Refresh session expired');
    }

    await this.redis.setBlocklist(payload.jti, this.refreshTtlSeconds);

    return this.issueTokens(user, payload.jti);
  }

  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      const access = this.jwt.verify<JwtPayload>(accessToken, {
        secret: accessVerificationKey(),
        algorithms: [jwtAlgorithm()],
      });
      await this.redis.setBlocklist(access.jti, this.accessTtlSeconds);
    } catch {
      /* ignore invalid access token on logout */
    }

    if (refreshToken) {
      try {
        const refresh = await this.verifyRefreshToken(refreshToken);
        await this.redis.setBlocklist(refresh.jti, this.refreshTtlSeconds);
        await this.prisma.authRefreshSession.deleteMany({
          where: { refreshJti: refresh.jti },
        });
      } catch {
        /* ignore */
      }
    }
  }

  async getProfile(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }
    const cardsScanned = await this.prisma.contact.count({
      where: { createdById: userId, deletedAt: null },
    });
    return {
      ...this.mapUser(user),
      organizationName: user.organization?.name,
      createdAt: user.createdAt,
      cardsScanned,
    };
  }

  static async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }
}
