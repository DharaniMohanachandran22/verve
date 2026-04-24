import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // Priority: Authorization Bearer header → access_token cookie
    let token: string | undefined;
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'changeme') as {
        userId: string;
        email: string;
      };
      (req as any).user = { userId: payload.userId, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
