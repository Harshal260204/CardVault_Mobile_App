import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const started = Date.now();
    const correlationId = req.headers['x-correlation-id'];
    const contentLength = req.headers['content-length'];

    res.on('finish', () => {
      this.logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms ` +
          `ip=${req.ip} len=${contentLength ?? '-'} correlationId=${correlationId ?? '-'}`,
      );
    });

    if (req.method === 'POST' && req.originalUrl.includes('/ocr/jobs')) {
      this.logger.log(
        `→ OCR upload incoming content-type=${req.headers['content-type'] ?? '-'} len=${contentLength ?? '-'}`,
      );
    }

    next();
  }
}
