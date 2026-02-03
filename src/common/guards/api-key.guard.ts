import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('API key is required');
    }

    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      throw new UnauthorizedException('API key not configured on server');
    }

    if (token !== apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      // Also check for x-api-key header as alternative
      return request.headers['x-api-key'] as string | undefined;
    }

    const [type, token] = authHeader.split(' ');

    if (type === 'Bearer' && token) {
      return token;
    }

    // Support "ApiKey <token>" format as well
    if (type === 'ApiKey' && token) {
      return token;
    }

    return undefined;
  }
}
