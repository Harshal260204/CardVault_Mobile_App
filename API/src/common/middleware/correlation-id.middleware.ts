import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_HEADER = 'x-correlation-id';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const incoming =
      req.headers[CORRELATION_HEADER] ?? req.headers['X-Correlation-ID'];
    const correlationId =
      typeof incoming === 'string' && incoming.trim() && isUuid(incoming.trim())
        ? incoming.trim()
        : randomUUID();
    req.headers[CORRELATION_HEADER] = correlationId;
    (req as Request & { correlationId: string }).correlationId = correlationId;
    next();
  }
}
