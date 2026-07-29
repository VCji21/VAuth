import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppStatus, Prisma, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuditService } from '../audit/audit.service';
import { ClientsService } from '../clients/clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignOutDto } from './dto/sign-out.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInAttemptService } from './sign-in-attempt.service';
import { TokenService, AuthTokenResponse } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsService: ClientsService,
    private readonly tokenService: TokenService,
    private readonly audit: AuditService,
    private readonly signInAttempts: SignInAttemptService,
  ) {}

  async signUp(dto: SignUpDto): Promise<AuthTokenResponse> {
    const app = await this.clientsService.findActiveByClientId(dto.clientId);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const createdUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
        },
        select: { id: true, email: true, name: true },
      });

      await tx.credential.create({
        data: {
          userId: user.id,
          passwordHash: await argon2.hash(dto.password, {
            type: argon2.argon2id,
          }),
        },
      });

      const membership = await tx.appMembership.create({
        data: {
          userId: user.id,
          appId: app.id,
        },
        select: { id: true },
      });

      const defaultRole = await tx.role.findUnique({
        where: { appId_name: { appId: app.id, name: 'member' } },
        select: { id: true },
      });

      if (defaultRole) {
        await tx.userRole.create({
          data: {
            membershipId: membership.id,
            roleId: defaultRole.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          appId: app.id,
          event: 'auth.signup',
          metadata: { clientId: app.clientId },
        },
      });

      return user;
    });

    return this.issueForUserAndApp(createdUser, app);
  }

  async signIn(dto: SignInDto): Promise<AuthTokenResponse> {
    const app = await this.clientsService.findActiveByClientId(dto.clientId);
    this.signInAttempts.assertAllowed(dto);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { credentials: true },
    });

    const credential = user?.credentials[0];
    const passwordValid =
      credential &&
      (await argon2.verify(credential.passwordHash, dto.password));

    if (!user || user.status !== UserStatus.ACTIVE || !passwordValid) {
      this.signInAttempts.recordFailure(dto);
      await this.audit.record({
        appId: app.id,
        event: 'auth.signin.failure',
        metadata: { email: dto.email },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const membership = await this.prisma.appMembership.findUnique({
      where: { userId_appId: { userId: user.id, appId: app.id } },
      select: { id: true },
    });

    if (!membership) {
      this.signInAttempts.recordFailure(dto);
      await this.audit.record({
        userId: user.id,
        appId: app.id,
        event: 'auth.signin.failure',
        metadata: { reason: 'missing_membership' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    this.signInAttempts.clear(dto);

    await this.audit.record({
      userId: user.id,
      appId: app.id,
      event: 'auth.signin.success',
      metadata: { clientId: app.clientId },
    });

    return this.issueForUserAndApp(
      { id: user.id, email: user.email, name: user.name },
      app,
    );
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokenResponse> {
    const payload = await this.tokenService.verifyRefreshToken(
      dto.refreshToken,
    );
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const records = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        appId: payload.appId,
        familyId: payload.familyId,
      },
      orderBy: { createdAt: 'desc' },
    });

    let matchedRecord: (typeof records)[number] | undefined;
    for (const record of records) {
      if (await argon2.verify(record.tokenHash, dto.refreshToken)) {
        matchedRecord = record;
        break;
      }
    }

    if (!matchedRecord) {
      await this.revokeTokenFamily(payload.familyId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (matchedRecord.revokedAt || matchedRecord.expiresAt <= new Date()) {
      await this.revokeTokenFamily(payload.familyId);
      await this.audit.record({
        userId: payload.sub,
        appId: payload.appId,
        event: 'auth.refresh.reuse_detected',
        metadata: { familyId: payload.familyId },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const [user, app] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, status: true },
      }),
      this.prisma.clientApp.findUnique({
        where: { id: payload.appId },
        select: { id: true, clientId: true, status: true },
      }),
    ]);

    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      !app ||
      app.status !== AppStatus.ACTIVE ||
      app.clientId !== payload.clientId
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: matchedRecord.id },
      data: { revokedAt: new Date() },
    });

    await this.audit.record({
      userId: user.id,
      appId: app.id,
      event: 'auth.refresh.success',
      metadata: { familyId: payload.familyId },
    });

    return this.issueForUserAndApp(user, app, payload.familyId);
  }

  async signOut(dto: SignOutDto): Promise<{ signedOut: true }> {
    const payload = await this.tokenService.verifyRefreshToken(
      dto.refreshToken,
    );
    const records = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        appId: payload.appId,
        familyId: dto.allSessions ? undefined : payload.familyId,
        revokedAt: null,
      },
    });

    let matchedRecord: (typeof records)[number] | undefined;
    for (const record of records) {
      if (await argon2.verify(record.tokenHash, dto.refreshToken)) {
        matchedRecord = record;
        break;
      }
    }

    if (!matchedRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (dto.allSessions) {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: payload.sub,
          appId: payload.appId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.revokeTokenFamily(payload.familyId);
    }

    await this.audit.record({
      userId: payload.sub,
      appId: payload.appId,
      event: 'auth.signout',
      metadata: {
        familyId: payload.familyId,
        allSessions: dto.allSessions ?? false,
      },
    });

    return { signedOut: true };
  }

  async me(
    userId: string,
    appId: string,
  ): Promise<
    AuthTokenResponse['user'] & {
      appId: string;
      roles: string[];
      permissions: string[];
    }
  > {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    const authorization = await this.loadAuthorization(userId, appId);
    return {
      ...user,
      appId,
      roles: authorization.roles,
      permissions: authorization.permissions,
    };
  }

  async issueForUserAndApp(
    user: { id: string; email: string; name?: string | null },
    app: { id: string; clientId: string },
    familyId?: string,
  ): Promise<AuthTokenResponse> {
    const authorization = await this.loadAuthorization(user.id, app.id);
    return this.tokenService.issueTokenPair({
      user,
      app,
      roles: authorization.roles,
      permissions: authorization.permissions,
      familyId,
    });
  }

  private async loadAuthorization(
    userId: string,
    appId: string,
  ): Promise<{ roles: string[]; permissions: string[] }> {
    const membership = await this.prisma.appMembership.findUnique({
      where: { userId_appId: { userId, appId } },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = membership.roles.map(({ role }) => role.name);
    const permissions = [
      ...new Set(
        membership.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.action),
        ),
      ),
    ];

    return { roles, permissions };
  }

  private revokeTokenFamily(
    familyId: string,
  ): Prisma.PrismaPromise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
