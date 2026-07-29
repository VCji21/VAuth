import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import type { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenPayload } from './types/access-token-payload.type';
import { RefreshTokenPayload } from './types/refresh-token-payload.type';

export type SanitizedUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthTokenResponse = {
  user: SanitizedUser;
  app: {
    id: string;
    clientId: string;
  };
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async issueTokenPair(input: {
    user: SanitizedUser;
    app: { id: string; clientId: string };
    roles: string[];
    permissions: string[];
    familyId?: string;
  }): Promise<AuthTokenResponse> {
    const familyId = input.familyId ?? randomUUID();
    const accessPayload: AccessTokenPayload = {
      sub: input.user.id,
      email: input.user.email,
      appId: input.app.id,
      clientId: input.app.clientId,
      roles: input.roles,
      permissions: input.permissions,
      typ: 'access',
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: input.user.id,
      appId: input.app.id,
      clientId: input.app.clientId,
      familyId,
      typ: 'refresh',
    };

    const accessExpiresIn = this.configService.getOrThrow<string>(
      'JWT_ACCESS_EXPIRES_IN',
    ) as SignOptions['expiresIn'];
    const refreshExpiresIn = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) as SignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    const decodedRefresh =
      await this.jwtService.verifyAsync<RefreshTokenPayload & { exp: number }>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

    await this.prisma.refreshToken.create({
      data: {
        userId: input.user.id,
        appId: input.app.id,
        tokenHash: await argon2.hash(refreshToken, { type: argon2.argon2id }),
        familyId,
        expiresAt: new Date(decodedRefresh.exp * 1000),
      },
    });

    return {
      user: input.user,
      app: input.app,
      roles: input.roles,
      permissions: input.permissions,
      accessToken,
      refreshToken,
    };
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync<AccessTokenPayload>(token, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }
}
