import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memoryBlocklist = new Map<string, number>();
  private memoryRate = new Map<string, { count: number; resetAt: number }>();

  constructor() {
    if (typeof setInterval !== 'undefined') {
      const interval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of this.memoryRate.entries()) {
          if (now > entry.resetAt) {
            this.memoryRate.delete(key);
          }
        }
        for (const [jti, exp] of this.memoryBlocklist.entries()) {
          if (now > exp) {
            this.memoryBlocklist.delete(jti);
          }
        }
      }, 60000);
      interval.unref?.();
    }
  }

  get enabled(): boolean {
    return Boolean(process.env.REDIS_URL?.trim());
  }

  getClient(): Redis | null {
    if (!this.enabled) {
      return null;
    }
    if (!this.client) {
      this.client = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      this.client.connect().catch((err) => {
        this.logger.error('Redis connect failed', err);
      });
    }
    return this.client;
  }

  async ping(): Promise<'up' | 'down'> {
    const redis = this.getClient();
    if (!redis) {
      return 'down';
    }
    try {
      const pong = await redis.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }

  async setBlocklist(jti: string, ttlSeconds: number): Promise<void> {
    const redis = this.getClient();
    if (redis) {
      await redis.set(`blocklist:${jti}`, '1', 'EX', Math.max(1, ttlSeconds));
      return;
    }
    this.memoryBlocklist.set(jti, Date.now() + ttlSeconds * 1000);
  }

  async isBlocklisted(jti: string): Promise<boolean> {
    const redis = this.getClient();
    if (redis) {
      const v = await redis.get(`blocklist:${jti}`);
      return v === '1';
    }
    const exp = this.memoryBlocklist.get(jti);
    if (!exp) {
      return false;
    }
    if (Date.now() > exp) {
      this.memoryBlocklist.delete(jti);
      return false;
    }
    return true;
  }

  /** Sliding window rate limit. Returns true if allowed. */
  async rateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const redis = this.getClient();
    if (redis) {
      const bucket = `ratelimit:${key}`;
      const results = await redis
        .multi()
        .incr(bucket)
        .expire(bucket, windowSeconds)
        .exec();
      if (!results || !results.length) {
        return false;
      }
      const count = results[0][1] as number;
      return count <= limit;
    }
    const now = Date.now();
    const entry = this.memoryRate.get(key);
    if (!entry || now > entry.resetAt) {
      this.memoryRate.set(key, {
        count: 1,
        resetAt: now + windowSeconds * 1000,
      });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  }

  async incrSessionScan(sessionId: string): Promise<number> {
    const redis = this.getClient();
    if (!redis) {
      return 0;
    }
    return redis.incr(`session:scan:${sessionId}`);
  }

  async getSessionScanBuffer(sessionId: string): Promise<number> {
    const redis = this.getClient();
    if (!redis) {
      return 0;
    }
    const v = await redis.get(`session:scan:${sessionId}`);
    return v ? Number.parseInt(v, 10) : 0;
  }

  async clearSessionScanBuffer(sessionId: string): Promise<void> {
    const redis = this.getClient();
    if (redis) {
      await redis.del(`session:scan:${sessionId}`);
    }
  }

  onModuleDestroy(): void {
    this.client?.disconnect();
  }
}
