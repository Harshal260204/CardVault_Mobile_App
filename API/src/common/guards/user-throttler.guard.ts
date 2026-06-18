import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id || req.ip;
  }

  protected async handleRequest(requestProps: any): Promise<boolean> {
    const { context } = requestProps;
    const req = context.switchToHttp().getRequest();
    
    // Bypass throttling entirely for super admins
    if (req.user?.role === 'super_admin') {
      return true;
    }
    
    return super.handleRequest(requestProps);
  }
}
