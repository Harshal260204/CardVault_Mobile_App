import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import type { RequestUser } from './auth.types';
import { CORRELATION_HEADER } from '../../common/middleware/correlation-id.middleware';

type AuthRequest = Request & { correlationId?: string };

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  private logContext(req: AuthRequest): string {
    const correlationId =
      req.correlationId ??
      (typeof req.headers['x-correlation-id'] === 'string'
        ? req.headers['x-correlation-id']
        : 'none');
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const client =
      req.get('x-client-platform') ??
      req.get('user-agent')?.slice(0, 60) ??
      'unknown';
    return `correlationId=${correlationId} ip=${ip} client=${client}`;
  }

  @Public()

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: AuthRequest) {
    const email = dto.email.trim().toLowerCase();
    this.logger.log(`[auth/register] attempt email=${email} ${this.logContext(req)}`);
    try {
      const correlationId =
        req.correlationId ??
        (typeof req.headers[CORRELATION_HEADER] === 'string'
          ? req.headers[CORRELATION_HEADER]
          : undefined);
      const result = await this.authService.register(dto, {
        ipAddress: req.ip,
        correlationId,
      });
      this.logger.log(`[auth/register] success email=${email} userId=${result.user.id} ${this.logContext(req)}`);
      return { data: result };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[auth/register] failed email=${email} reason=${reason} ${this.logContext(req)}`);
      throw error;
    }
  }

  @Public()

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: AuthRequest) {
    const email = dto.email.trim().toLowerCase();
    this.logger.log(
      `[auth/login] attempt email=${email} ${this.logContext(req)}`,
    );
    try {
      const correlationId =
        req.correlationId ??
        (typeof req.headers[CORRELATION_HEADER] === 'string'
          ? req.headers[CORRELATION_HEADER]
          : undefined);
      const result = await this.authService.login(dto, {
        ipAddress: req.ip,
        correlationId,
      });
      this.logger.log(
        `[auth/login] success email=${email} userId=${result.user.id} role=${result.user.role} ${this.logContext(req)}`,
      );
      return { data: result };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `[auth/login] failed email=${email} reason=${reason} ${this.logContext(req)}`,
      );
      throw error;
    }
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto, @Req() req: AuthRequest) {
    this.logger.log(`[auth/refresh] attempt ${this.logContext(req)}`);
    try {
      const tokens = await this.authService.refresh(dto.refreshToken);
      this.logger.log(`[auth/refresh] success ${this.logContext(req)}`);
      return { data: tokens };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `[auth/refresh] failed reason=${reason} ${this.logContext(req)}`,
      );
      throw error;
    }
  }

  @Post('logout')
  async logout(@Req() req: AuthRequest, @Body() dto: LogoutDto) {
    const header = req.headers.authorization;
    const accessToken = header?.startsWith('Bearer ') ? header.slice(7) : '';
    await this.authService.logout(accessToken, dto.refreshToken);
    return { data: { success: true } };
  }

  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    const profile = await this.authService.getProfile(user.id);
    return { data: profile };
  }
}
