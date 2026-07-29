import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (
      request.params.clientId &&
      request.user?.clientId !== request.params.clientId
    ) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    const userPermissions = request.user?.permissions ?? [];
    const allowed = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!allowed) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
