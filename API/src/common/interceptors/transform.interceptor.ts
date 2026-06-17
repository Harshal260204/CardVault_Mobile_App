import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string> }>();
    const correlationId =
      request.headers['x-correlation-id'] ??
      request.headers['X-Correlation-ID'];

    const reqCorrelation =
      (request as { correlationId?: string }).correlationId ?? correlationId;

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'data' in (data as object)) {
          const envelope = data as {
            data: unknown;
            meta?: Record<string, unknown>;
          };
          return {
            ...envelope,
            meta: { ...envelope.meta, correlationId: reqCorrelation },
          };
        }
        return {
          data,
          meta: { correlationId: reqCorrelation },
        };
      }),
    );
  }
}
