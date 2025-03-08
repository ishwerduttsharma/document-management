import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Ensure user is attached to the request (e.g., via Auth Guard)

    if (!user || user?.platformRole !== 'ADMIN') {
      throw new ForbiddenException('Access denied. Admins only.');
    }

    return true; // Grant access
  }
}
