import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppStatus, OAuthProvider, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { AuthTokenResponse } from '../auth/token.service';
import { AuditService } from '../audit/audit.service';
import { ClientsService } from '../clients/clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { OAuthStateService } from './oauth-state.service';
import { OAuthProfile } from './types/oauth-profile.type';

const CALLBACK_CODE_TTL_MS = 5 * 60 * 1000;
const OAUTH_TRANSACTION_TIMEOUT_MS = 15_000;

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsService: ClientsService,
    private readonly oauthState: OAuthStateService,
    private readonly authService: AuthService,
    private readonly audit: AuditService,
  ) {}

  async createState(input: {
    clientId: string;
    redirectUri: string;
  }): Promise<string> {
    const app = await this.clientsService.findActiveByClientId(input.clientId);
    this.clientsService.validateRedirectUri(app, input.redirectUri);
    return this.oauthState.sign(input);
  }

  async completeGoogleLogin(input: {
    state: string;
    profile: OAuthProfile;
  }): Promise<{ redirectUri: string; code: string }> {
    if (!input.profile.email || !input.profile.emailVerified) {
      throw new BadRequestException(
        'Verified Google account email is required',
      );
    }

    const state = await this.oauthState.verify(input.state);
    const app = await this.clientsService.findActiveByClientId(state.clientId);
    this.clientsService.validateRedirectUri(app, state.redirectUri);

    const user = await this.prisma.$transaction(
      async (tx) => {
        const externalAccount = await tx.externalAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: OAuthProvider.GOOGLE,
              providerAccountId: input.profile.providerAccountId,
            },
          },
          include: { user: true },
        });

        const accountUser =
          externalAccount?.user ??
          (await tx.user.upsert({
            where: { email: input.profile.email as string },
            update: { name: input.profile.name },
            create: {
              email: input.profile.email as string,
              name: input.profile.name,
            },
          }));

        if (!externalAccount) {
          await tx.externalAccount.create({
            data: {
              userId: accountUser.id,
              provider: OAuthProvider.GOOGLE,
              providerAccountId: input.profile.providerAccountId,
              email: input.profile.email,
            },
          });
        }

        const membership = await tx.appMembership.upsert({
          where: { userId_appId: { userId: accountUser.id, appId: app.id } },
          update: {},
          create: { userId: accountUser.id, appId: app.id },
        });

        const defaultRole = await tx.role.findUnique({
          where: { appId_name: { appId: app.id, name: 'member' } },
          select: { id: true },
        });
        if (defaultRole) {
          await tx.userRole.upsert({
            where: {
              membershipId_roleId: {
                membershipId: membership.id,
                roleId: defaultRole.id,
              },
            },
            update: {},
            create: { membershipId: membership.id, roleId: defaultRole.id },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: accountUser.id,
            appId: app.id,
            event: 'auth.oauth.google',
            metadata: { clientId: app.clientId },
          },
        });

        return {
          id: accountUser.id,
          email: accountUser.email,
          name: accountUser.name,
        };
      },
      { timeout: OAUTH_TRANSACTION_TIMEOUT_MS },
    );

    return {
      redirectUri: state.redirectUri,
      code: await this.createCallbackCode({
        userId: user.id,
        appId: app.id,
        redirectUri: state.redirectUri,
      }),
    };
  }

  async exchangeCallbackCode(input: {
    clientId: string;
    code: string;
    redirectUri: string;
  }): Promise<AuthTokenResponse> {
    const app = await this.clientsService.findActiveByClientId(input.clientId);
    this.clientsService.validateRedirectUri(app, input.redirectUri);

    const records = await this.prisma.oAuthCallbackCode.findMany({
      where: {
        appId: app.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    let matchedRecord: (typeof records)[number] | undefined;
    for (const record of records) {
      if (
        record.redirectUri === input.redirectUri &&
        (await argon2.verify(record.codeHash, input.code))
      ) {
        matchedRecord = record;
        break;
      }
    }

    if (!matchedRecord) {
      throw new UnauthorizedException('Invalid OAuth callback code');
    }

    const consumed = await this.prisma.oAuthCallbackCode.updateMany({
      where: {
        id: matchedRecord.id,
        appId: app.id,
        redirectUri: input.redirectUri,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });

    if (consumed.count !== 1) {
      throw new UnauthorizedException('Invalid OAuth callback code');
    }

    const [user, freshApp] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: matchedRecord.userId },
        select: { id: true, email: true, name: true, status: true },
      }),
      this.prisma.clientApp.findUnique({
        where: { id: matchedRecord.appId },
        select: { id: true, clientId: true, status: true },
      }),
    ]);

    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      !freshApp ||
      freshApp.status !== AppStatus.ACTIVE ||
      freshApp.clientId !== input.clientId
    ) {
      throw new UnauthorizedException('Invalid OAuth callback code');
    }

    await this.audit.record({
      userId: user.id,
      appId: freshApp.id,
      event: 'auth.oauth.exchange',
      metadata: { clientId: freshApp.clientId },
    });

    return this.authService.issueForUserAndApp(user, freshApp);
  }

  private async createCallbackCode(input: {
    userId: string;
    appId: string;
    redirectUri: string;
  }): Promise<string> {
    const code = randomBytes(32).toString('base64url');
    await this.prisma.oAuthCallbackCode.create({
      data: {
        userId: input.userId,
        appId: input.appId,
        redirectUri: input.redirectUri,
        codeHash: await argon2.hash(code, { type: argon2.argon2id }),
        expiresAt: new Date(Date.now() + CALLBACK_CODE_TTL_MS),
      },
    });
    return code;
  }
}
