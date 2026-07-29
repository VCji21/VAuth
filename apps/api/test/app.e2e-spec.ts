import {
  Controller,
  Get,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { RequirePermissions } from '../src/auth/decorators/require-permissions.decorator';
import { RequireRoles } from '../src/auth/decorators/require-roles.decorator';
import { OAuthService } from '../src/oauth/oauth.service';
import { PrismaService } from '../src/prisma/prisma.service';

process.env.API_PORT ??= '8000';
process.env.WEB_APP_URL ??= 'http://localhost:3000';
process.env.JWT_ACCESS_SECRET ??= 'e2e-access-secret-at-least-32-characters';
process.env.JWT_ACCESS_EXPIRES_IN ??= '15m';
process.env.JWT_REFRESH_SECRET ??= 'e2e-refresh-secret-at-least-32-characters';
process.env.JWT_REFRESH_EXPIRES_IN ??= '7d';
process.env.GOOGLE_CLIENT_ID ??= 'e2e-google-client-id';
process.env.GOOGLE_CLIENT_SECRET ??= 'e2e-google-client-secret';
process.env.GOOGLE_CALLBACK_URL ??=
  'http://localhost:8000/auth/google/callback';

jest.setTimeout(60000);

type AuthResponse = {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  app: {
    id: string;
    clientId: string;
  };
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
};

@Controller('e2e-guard')
class E2eGuardController {
  @Get('owner-only')
  @RequireRoles('owner')
  ownerOnly(): { ok: true } {
    return { ok: true };
  }

  @Get('profile-read')
  @RequirePermissions('profile:read')
  profileRead(): { ok: true } {
    return { ok: true };
  }
}

describe('VAuth auth flows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let oauthService: OAuthService;
  let httpServer: Parameters<typeof request>[0];
  let namespace: string;

  beforeAll(async () => {
    const { AppModule } =
      require('../src/app.module') as typeof import('../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [E2eGuardController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    oauthService = app.get(OAuthService);
    httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    namespace = `e2e_${Date.now()}`;
  });

  afterAll(async () => {
    await cleanupNamespace();
    await app?.close();
  });

  it('signs up a user and returns only sanitized auth data', async () => {
    const clientId = await createClientApp('signup');
    const response = await signUp(clientId, 'signup-user');

    expect(response.status).toBe(201);
    expect(response.body.user.email).toContain(namespace);
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.roles).toEqual(['member']);
    expect(response.body.permissions).toEqual(['profile:read']);
  });

  it('rejects duplicate signup safely', async () => {
    const clientId = await createClientApp('duplicate');
    const email = emailFor('duplicate-user');

    await signUp(clientId, 'duplicate-user', email).expect(201);
    await signUp(clientId, 'duplicate-user', email).expect(409);
  });

  it('signs in valid users and rejects invalid credentials generically', async () => {
    const clientId = await createClientApp('signin');
    const email = emailFor('signin-user');

    await signUp(clientId, 'signin-user', email).expect(201);

    const validSignin = await request(httpServer)
      .post('/auth/signin')
      .send({ clientId, email, password: 'Password123!' })
      .expect(201);

    expect(validSignin.body.accessToken).toEqual(expect.any(String));

    const invalidSignin = await request(httpServer)
      .post('/auth/signin')
      .send({ clientId, email, password: 'wrong-password' })
      .expect(401);

    expect(invalidSignin.body.message).toBe('Invalid email or password');
  });

  it('rejects protected routes without a token', async () => {
    await request(httpServer).get('/auth/me').expect(401);
  });

  it('allows and denies permission-protected routes', async () => {
    const clientId = await createClientApp('permissions');
    const member = await signUp(clientId, 'permission-member').expect(201);

    await request(httpServer)
      .get('/e2e-guard/profile-read')
      .set('Authorization', `Bearer ${member.body.accessToken}`)
      .expect(200);

    await request(httpServer)
      .get('/clients')
      .set('Authorization', `Bearer ${member.body.accessToken}`)
      .expect(403);

    await assignRole(member.body.user.id, member.body.app.id, 'owner');

    const owner = await request(httpServer)
      .post('/auth/signin')
      .send({
        clientId,
        email: member.body.user.email,
        password: 'Password123!',
      })
      .expect(201);

    await request(httpServer)
      .get('/clients')
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .expect(200);
  });

  it('allows and denies role-protected routes', async () => {
    const clientId = await createClientApp('roles');
    const member = await signUp(clientId, 'role-member').expect(201);

    await request(httpServer)
      .get('/e2e-guard/owner-only')
      .set('Authorization', `Bearer ${member.body.accessToken}`)
      .expect(403);

    await assignRole(member.body.user.id, member.body.app.id, 'owner');

    const owner = await request(httpServer)
      .post('/auth/signin')
      .send({
        clientId,
        email: member.body.user.email,
        password: 'Password123!',
      })
      .expect(201);

    await request(httpServer)
      .get('/e2e-guard/owner-only')
      .set('Authorization', `Bearer ${owner.body.accessToken}`)
      .expect(200);
  });

  it('rejects a token for one app on another app-scoped route', async () => {
    const appAClientId = await createClientApp('app-a');
    const appBClientId = await createClientApp('app-b');
    const user = await signUp(appAClientId, 'wrong-app-user').expect(201);
    await assignRole(user.body.user.id, user.body.app.id, 'owner');

    const ownerForAppA = await request(httpServer)
      .post('/auth/signin')
      .send({
        clientId: appAClientId,
        email: user.body.user.email,
        password: 'Password123!',
      })
      .expect(201);

    await request(httpServer)
      .get(`/clients/${appBClientId}/roles`)
      .set('Authorization', `Bearer ${ownerForAppA.body.accessToken}`)
      .expect(403);
  });

  it('rotates refresh tokens and rejects reuse', async () => {
    const clientId = await createClientApp('refresh');
    const auth = await signUp(clientId, 'refresh-user').expect(201);
    const firstRefreshToken = auth.body.refreshToken;

    const refreshed = await request(httpServer)
      .post('/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(201);

    expect(refreshed.body.refreshToken).not.toBe(firstRefreshToken);

    await request(httpServer)
      .post('/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(401);
  });

  it('revokes refresh access on signout', async () => {
    const clientId = await createClientApp('signout');
    const auth = await signUp(clientId, 'signout-user').expect(201);

    await request(httpServer)
      .post('/auth/signout')
      .send({ refreshToken: auth.body.refreshToken })
      .expect(201);

    await request(httpServer)
      .post('/auth/refresh')
      .send({ refreshToken: auth.body.refreshToken })
      .expect(401);
  });

  it('revokes every active user/app session when allSessions is requested', async () => {
    const clientId = await createClientApp('all-sessions');
    const firstSession = await signUp(clientId, 'all-sessions-user').expect(
      201,
    );
    const secondSession = await request(httpServer)
      .post('/auth/signin')
      .send({
        clientId,
        email: firstSession.body.user.email,
        password: 'Password123!',
      })
      .expect(201);

    await request(httpServer)
      .post('/auth/signout')
      .send({ refreshToken: firstSession.body.refreshToken, allSessions: true })
      .expect(201);

    await request(httpServer)
      .post('/auth/refresh')
      .send({ refreshToken: secondSession.body.refreshToken })
      .expect(401);
  });

  it('exchanges OAuth callback codes once without putting tokens in the redirect', async () => {
    const clientId = await createClientApp('oauth-code');
    const redirectUri = 'http://localhost:3000/auth/callback';
    const state = await oauthService.createState({ clientId, redirectUri });

    const callback = await oauthService.completeGoogleLogin({
      state,
      profile: {
        providerAccountId: `${namespace}-google-user`,
        email: emailFor('oauth-code-user'),
        emailVerified: true,
        name: 'E2E OAuth User',
      },
    });

    expect(callback.redirectUri).toBe(redirectUri);
    expect(callback.code).toEqual(expect.any(String));
    expect(callback).not.toHaveProperty('tokens');

    const exchanged = await request(httpServer)
      .post('/auth/oauth/exchange')
      .send({ clientId, code: callback.code, redirectUri })
      .expect(201);

    expect(exchanged.body.accessToken).toEqual(expect.any(String));
    expect(exchanged.body.refreshToken).toEqual(expect.any(String));

    await request(httpServer)
      .post('/auth/oauth/exchange')
      .send({ clientId, code: callback.code, redirectUri })
      .expect(401);
  });

  it('atomically rejects concurrent OAuth callback code reuse', async () => {
    const clientId = await createClientApp('oauth-code-race');
    const redirectUri = 'http://localhost:3000/auth/callback';
    const state = await oauthService.createState({ clientId, redirectUri });

    const callback = await oauthService.completeGoogleLogin({
      state,
      profile: {
        providerAccountId: `${namespace}-google-race-user`,
        email: emailFor('oauth-code-race-user'),
        emailVerified: true,
        name: 'E2E OAuth Race User',
      },
    });

    const exchanges = await Promise.all(
      [0, 1].map(() =>
        request(httpServer)
          .post('/auth/oauth/exchange')
          .send({ clientId, code: callback.code, redirectUri }),
      ),
    );

    const statuses = exchanges
      .map((response) => response.status)
      .sort((left, right) => left - right);

    expect(statuses).toEqual([201, 401]);
  });

  it('blocks repeated signin failures for the same client and email', async () => {
    const clientId = await createClientApp('signin-abuse');
    const email = emailFor('signin-abuse-user');
    await signUp(clientId, 'signin-abuse-user', email).expect(201);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(httpServer)
        .post('/auth/signin')
        .send({ clientId, email, password: 'wrong-password' })
        .expect(401);
    }

    await request(httpServer)
      .post('/auth/signin')
      .send({ clientId, email, password: 'wrong-password' })
      .expect(429);
  });

  async function createClientApp(suffix: string): Promise<string> {
    const clientId = `${namespace}_${suffix}`;
    const appRecord = await prisma.clientApp.create({
      data: {
        name: `E2E ${suffix}`,
        slug: `${namespace}-${suffix}`,
        clientId,
        allowedOrigins: ['http://localhost:3000'],
        redirectUris: ['http://localhost:3000/auth/callback'],
      },
    });

    const createdPermissions = await Promise.all(
      [
        'profile:read',
        'profile:update',
        'admin:read',
        'roles:manage',
        'members:manage',
        'clients:manage',
      ].map((action) =>
        prisma.permission.create({
          data: {
            appId: appRecord.id,
            action,
          },
        }),
      ),
    );
    const permissionByAction = new Map(
      createdPermissions.map((permission) => [
        permission.action,
        permission.id,
      ]),
    );

    const rolePermissionMap: Record<string, string[]> = {
      member: ['profile:read'],
      owner: [
        'profile:read',
        'profile:update',
        'admin:read',
        'roles:manage',
        'members:manage',
        'clients:manage',
      ],
    };

    for (const [roleName, actions] of Object.entries(rolePermissionMap)) {
      const role = await prisma.role.create({
        data: {
          appId: appRecord.id,
          name: roleName,
          isSystem: true,
        },
      });

      await prisma.rolePermission.createMany({
        data: actions.map((action) => ({
          roleId: role.id,
          permissionId: permissionByAction.get(action) as string,
        })),
      });
    }

    return clientId;
  }

  function signUp(clientId: string, label: string, email = emailFor(label)) {
    return request(httpServer)
      .post('/auth/signup')
      .send({
        clientId,
        name: `E2E ${label}`,
        email,
        password: 'Password123!',
      });
  }

  function emailFor(label: string): string {
    return `${namespace}.${label}@example.com`;
  }

  async function assignRole(
    userId: string,
    appId: string,
    roleName: string,
  ): Promise<void> {
    const membership = await prisma.appMembership.findUniqueOrThrow({
      where: { userId_appId: { userId, appId } },
    });
    const role = await prisma.role.findUniqueOrThrow({
      where: { appId_name: { appId, name: roleName } },
    });
    await prisma.userRole.upsert({
      where: {
        membershipId_roleId: {
          membershipId: membership.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        membershipId: membership.id,
        roleId: role.id,
      },
    });
  }

  async function cleanupNamespace(): Promise<void> {
    if (!prisma || !namespace) {
      return;
    }

    await prisma.user.deleteMany({
      where: { email: { startsWith: `${namespace}.` } },
    });
    await prisma.clientApp.deleteMany({
      where: { clientId: { startsWith: namespace } },
    });
    await prisma.auditLog.deleteMany({
      where: {
        metadata: {
          path: ['clientId'],
          string_starts_with: namespace,
        },
      },
    });
  }
});
