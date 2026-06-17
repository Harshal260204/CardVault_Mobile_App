import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RedisService } from '../../redis/redis.service';
import type { RequestUser } from '../../modules/auth/auth.types';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyPrefix: string;
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!options) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const subject = req.user?.id ?? req.ip ?? 'anon';
    const key = `${options.keyPrefix}:${subject}`;
    const allowed = await this.redis.rateLimit(
      key,
      options.limit,
      options.windowSeconds,
    );
    if (!allowed) {
      throw new HttpException(
        { code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
