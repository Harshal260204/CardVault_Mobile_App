import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorPayload } from '../types/api-response.types';
import { CORRELATION_HEADER } from '../middleware/correlation-id.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();

    const correlationId =
      request.correlationId ??
      (typeof request.headers[CORRELATION_HEADER] === 'string'
        ? request.headers[CORRELATION_HEADER]
        : undefined);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let field: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        code = this.codeFromStatus(status);
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        const messages = obj.message;
        if (Array.isArray(messages)) {
          message = messages.join('; ');
          const first = messages[0];
          if (
            typeof first === 'object' &&
            first !== null &&
            'property' in first
          ) {
            field = String((first as { property?: string }).property);
          }
        } else if (typeof messages === 'string') {
          message = messages;
        }
        code =
          typeof obj.code === 'string' ? obj.code : this.codeFromStatus(status);
        if (typeof obj.error === 'string' && !messages) {
          message = obj.error;
        }
      }
    }

    const error: ApiErrorPayload = { code, message, correlationId };
    if (field) {
      error.field = field;
    }

    if (request.path?.includes('/auth/')) {
      this.logger.warn(
        `[auth] ${request.method} ${request.path} status=${status} code=${code} message=${message} correlationId=${correlationId ?? 'none'}`,
      );
    } else if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.path} status=${status} message=${message} correlationId=${correlationId ?? 'none'}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({ error });
  }

  private codeFromStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
    };
    return map[status] ?? 'HTTP_ERROR';
  }
}
