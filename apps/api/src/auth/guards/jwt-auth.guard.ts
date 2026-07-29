import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenService } from '../token.service';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const payload = await this.tokenService.verifyAccessToken(token);
    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Authentication required');
    }

    const [user, app] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, status: true },
      }),
      this.prisma.clientApp.findUnique({
        where: { id: payload.appId },
        select: { id: true, clientId: true, status: true },
      }),
    ]);

    if (!user || user.status !== 'ACTIVE' || !app || app.status !== 'ACTIVE') {
      throw new UnauthorizedException('Authentication required');
    }

    if (app.clientId !== payload.clientId) {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = payload;
    request.client = {
      appId: payload.appId,
      clientId: payload.clientId,
    };

    return true;
  }
}
