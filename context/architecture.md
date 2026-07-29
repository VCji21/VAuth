# Architecture: VAuth

This document describes what VAuth is, how the system is shaped, and the architectural decisions that must remain stable while building it.

For implementation sequencing, use `context/build_plan.md`.

## 1. Product Definition

VAuth is a reusable authentication platform.

It is built once and reused by many projects. It is not an auth feature embedded inside one Next.js app.

Core goal:

```txt
Many client apps
  -> trust one VAuth backend
  -> receive app-scoped tokens
  -> enforce app-specific roles and permissions
```

VAuth must support:

- Centralized identity.
- Password authentication.
- Google OAuth login.
- Registered client applications.
- App-scoped memberships.
- Dynamic roles per app.
- Dynamic permissions per app.
- JWT access tokens.
- Rotating refresh tokens.
- Token revocation.
- Audit logging.
- A reference Next.js client.

## 2. System Boundary

The backend is the product.

```txt
apps/api   -> VAuth authentication platform
apps/web   -> reference/demo client app
packages/* -> shared UI, config, and later reusable SDK/types
context/*  -> architecture, build plan, standards, and progress memory
```

Rules:

- `apps/api` owns identity, credentials, applications, roles, permissions, tokens, OAuth, and audit logs.
- `apps/web` consumes the backend like any external project would.
- `apps/web` must not read the database.
- `apps/web` must not own authentication business logic.
- Future projects should integrate through HTTP APIs or `packages/auth-client`.

## 3. Main Architecture Decision

Use a modular monolith.

This means:

- One NestJS deployable.
- One PostgreSQL database.
- Strong internal module boundaries.
- No microservices in the first version.

Reason:

- Auth workflows are tightly connected.
- A monolith keeps deployment and local development simple.
- NestJS modules give enough separation for maintainability.
- The system can split later if scale requires it.

## 4. Repository Architecture

```txt
VAuth/
  mono_auth/
    apps/
      api/
      web/
    packages/
      ui/
      eslint-config/
      typescript-config/
      auth-client/       typed VAuth HTTP client
      auth-types/        future
  context/
    architecture.md
    build_plan.md
    code_standards.md
    library_docs.md
    progress_tracker.md
```

Package ownership:

- `apps/api`: complete auth platform backend.
- `apps/web`: demo app and optional admin/reference UI.
- `packages/ui`: presentational UI only.
- `packages/auth-client`: future typed SDK for consuming projects.
- `packages/auth-types`: future shared API/token/session types.

## 5. Backend Module Architecture

Target NestJS module layout:

```txt
apps/api/src/
  app.module.ts
  main.ts

  config/
    config.module.ts
    env.validation.ts

  prisma/
    prisma.module.ts
    prisma.service.ts

  identity/
    identity.module.ts
    users.service.ts
    credentials.service.ts
    dto/

  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    token.service.ts
    session.service.ts
    decorators/
    guards/
    strategies/
    dto/
    types/

  clients/
    clients.module.ts
    clients.controller.ts
    clients.service.ts
    dto/

  access-control/
    access-control.module.ts
    roles.service.ts
    permissions.service.ts
    memberships.service.ts
    guards/
    decorators/
    dto/

  oauth/
    oauth.module.ts
    google.strategy.ts
    oauth.controller.ts
    oauth.service.ts

  audit/
    audit.module.ts
    audit.service.ts

  health/
    health.module.ts
    health.controller.ts
```

Module responsibilities:

- `config`: typed environment loading and validation.
- `prisma`: Prisma lifecycle and database access foundation.
- `identity`: users, local credentials, external identities.
- `auth`: signup, signin, refresh, signout, token issuing, auth guards.
- `clients`: registered applications that consume VAuth.
- `access-control`: roles, permissions, memberships, app-scoped authorization.
- `oauth`: external OAuth providers such as Google.
- `audit`: security/admin event history.
- `health`: public health checks.

Controllers stay thin. Services own business logic. Guards own access decisions.

## 6. Domain Model

VAuth is auth-first. It must not include unrelated app-domain models such as posts, comments, categories, products, or todos.

Core entities:

- `User`: central identity profile.
- `Credential`: local password credential.
- `ExternalAccount`: Google and future external identity providers.
- `ClientApp`: a project/application registered to use VAuth.
- `AppMembership`: a user's membership in one client app.
- `Role`: app-scoped role.
- `Permission`: app-scoped permission.
- `UserRole`: role assignment for one app membership.
- `RolePermission`: permission assignment for one role.
- `RefreshToken`: server-side refresh token record.
- `OAuthCallbackCode`: short-lived single-use code for OAuth frontend callback exchange.
- `AuditLog`: security and administrative event log.

Important relationship rules:

- A user can belong to many apps.
- A client app can define its own roles.
- A client app can define its own permissions.
- Role names are unique per app, not globally.
- Permission actions are unique per app, not globally.
- Tokens are scoped to one app.
- Refresh tokens are scoped to one user and one app.

## 7. Prisma Schema Architecture

Target schema shape:

```prisma
model User {
  id          String     @id @default(cuid())
  email       String     @unique
  name        String?
  status      UserStatus @default(ACTIVE)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  credentials      Credential[]
  externalAccounts ExternalAccount[]
  memberships      AppMembership[]
  refreshTokens    RefreshToken[]
  auditLogs        AuditLog[]
}

model Credential {
  id           String   @id @default(cuid())
  userId       String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId])
}

model ExternalAccount {
  id                String        @id @default(cuid())
  userId            String
  provider          OAuthProvider
  providerAccountId String
  email             String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model ClientApp {
  id               String    @id @default(cuid())
  name             String
  slug             String    @unique
  clientId         String    @unique
  clientSecretHash String?
  allowedOrigins   String[]
  redirectUris     String[]
  status           AppStatus @default(ACTIVE)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  roles         Role[]
  permissions   Permission[]
  memberships   AppMembership[]
  refreshTokens RefreshToken[]
}

model AppMembership {
  id        String   @id @default(cuid())
  userId    String
  appId     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  app   ClientApp @relation(fields: [appId], references: [id], onDelete: Cascade)
  roles UserRole[]

  @@unique([userId, appId])
}

model Role {
  id          String   @id @default(cuid())
  appId       String
  name        String
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  app         ClientApp        @relation(fields: [appId], references: [id], onDelete: Cascade)
  users       UserRole[]
  permissions RolePermission[]

  @@unique([appId, name])
}

model Permission {
  id          String   @id @default(cuid())
  appId       String
  action      String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  app   ClientApp        @relation(fields: [appId], references: [id], onDelete: Cascade)
  roles RolePermission[]

  @@unique([appId, action])
}

model UserRole {
  id           String @id @default(cuid())
  membershipId String
  roleId       String

  membership AppMembership @relation(fields: [membershipId], references: [id], onDelete: Cascade)
  role       Role          @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([membershipId, roleId])
}

model RolePermission {
  id           String @id @default(cuid())
  roleId       String
  permissionId String

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}

model RefreshToken {
  id        String    @id @default(cuid())
  userId    String
  appId     String
  tokenHash String
  familyId  String
  revokedAt DateTime?
  expiresAt DateTime
  createdAt DateTime  @default(now())

  user User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  app  ClientApp @relation(fields: [appId], references: [id], onDelete: Cascade)
}

model OAuthCallbackCode {
  id         String    @id @default(cuid())
  userId     String
  appId      String
  codeHash   String
  redirectUri String
  consumedAt DateTime?
  expiresAt  DateTime
  createdAt  DateTime  @default(now())

  user User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  app  ClientApp @relation(fields: [appId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  appId     String?
  event     String
  ipAddress String?
  userAgent String?
  metadata  Json?
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}

enum UserStatus {
  ACTIVE
  DISABLED
}

enum AppStatus {
  ACTIVE
  DISABLED
}

enum OAuthProvider {
  GOOGLE
}
```

## 8. Client App Architecture

Every consuming project is represented as a `ClientApp`.

Client app fields:

- `name`: human-readable name.
- `slug`: stable readable identifier.
- `clientId`: public client identifier.
- `clientSecretHash`: optional hashed secret for confidential clients.
- `allowedOrigins`: browser origin allow-list.
- `redirectUris`: OAuth/callback allow-list.
- `status`: active or disabled.

Example:

```txt
clientId: vauth_demo_web
slug: vauth-demo-web
roles: owner, admin, member
permissions: profile:read, profile:update, admin:read
```

## 9. Authentication Architecture

Authentication proves who the user is.

Supported first-version flows:

- Email/password signup.
- Email/password signin.
- Google OAuth login.
- Refresh token flow.
- Signout/revocation.

Password rules:

- Store passwords only as Argon2id hashes.
- Store password hashes in `Credential`, not `User`.
- Return sanitized user data only.

Google OAuth rules:

- Google is an external login provider.
- Google access tokens are not VAuth access tokens.
- VAuth issues its own app-scoped tokens after Google identity is verified.
- OAuth state must carry and validate `clientId` and `redirectUri`.
- OAuth provider callbacks must redirect frontend apps with a short-lived one-time code, not VAuth tokens in query params.
- Frontend apps exchange OAuth callback codes server-side for VAuth app-scoped tokens.

## 10. Token Architecture

VAuth uses short-lived JWT access tokens plus server-side rotating refresh tokens.

Access token payload:

```ts
type AccessTokenPayload = {
  sub: string;
  email: string;
  appId: string;
  clientId: string;
  roles: string[];
  permissions: string[];
};
```

Refresh token payload:

```ts
type RefreshTokenPayload = {
  sub: string;
  appId: string;
  clientId: string;
  familyId: string;
};
```

Rules:

- Access tokens are app-scoped.
- Refresh tokens are app-scoped.
- Access tokens should be short lived.
- Refresh tokens should be longer lived.
- Refresh tokens are stored only as hashes.
- Refresh tokens rotate on every refresh.
- Refresh token reuse revokes the token family.
- A token for one app must not authorize another app.

## 11. Authorization Architecture

Authorization decides what a user can do.

Use permission-first authorization.

Roles are bundles of permissions:

```txt
role: admin
  permissions:
    members:manage
    roles:manage
    admin:read

role: member
  permissions:
    profile:read
    profile:update
```

Backend route metadata:

```ts
@Public()
@RequirePermissions("members:manage")
@RequireRoles("owner")
@CurrentUser()
@CurrentClient()
```

Rules:

- Backend authorization is authoritative.
- Frontend authorization is UX only.
- Prefer permission checks over role-name checks.
- Guards must check app scope.
- Role and permission names from one app cannot authorize another app.

## 12. API Architecture

Public auth routes:

```txt
POST /auth/signup
POST /auth/signin
POST /auth/refresh
POST /auth/signout
GET  /auth/google
GET  /auth/google/callback
POST /auth/oauth/exchange
GET  /health
```

Protected identity route:

```txt
GET /auth/me
```

Client app management routes:

```txt
POST   /clients
GET    /clients
GET    /clients/:id
PATCH  /clients/:id
DELETE /clients/:id
```

Access-control routes:

```txt
POST   /clients/:clientId/roles
GET    /clients/:clientId/roles
PATCH  /clients/:clientId/roles/:roleId
DELETE /clients/:clientId/roles/:roleId

POST   /clients/:clientId/permissions
GET    /clients/:clientId/permissions
PATCH  /clients/:clientId/permissions/:permissionId
DELETE /clients/:clientId/permissions/:permissionId

POST   /clients/:clientId/roles/:roleId/permissions/:permissionId
DELETE /clients/:clientId/roles/:roleId/permissions/:permissionId

POST   /clients/:clientId/memberships
GET    /clients/:clientId/memberships
PATCH  /clients/:clientId/memberships/:membershipId/roles
DELETE /clients/:clientId/memberships/:membershipId
```

Every auth request must include app context:

```txt
clientId
redirectUri, when applicable
```

## 13. Frontend Architecture

The Next.js frontend is a reference client.

It demonstrates how another project consumes VAuth:

- Passes configured `clientId`.
- Calls backend auth APIs.
- Stores encrypted HTTP-only session cookie.
- Calls protected API routes with access token.
- Refreshes tokens server-side.
- Protects pages with middleware.
- Uses app-scoped roles/permissions for UX decisions.

Frontend session payload:

```ts
type WebSession = {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  clientId: string;
  appId: string;
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
};
```

Rules:

- Do not store tokens in `localStorage`.
- Do not expose refresh tokens to Client Components.
- Do not treat frontend middleware as authoritative security.

## 14. Future SDK Architecture

After the demo app proves the API contract, create:

```txt
packages/auth-client/
  src/
    create-auth-client.ts
    middleware.ts
    types.ts
```

Purpose:

- Reduce repeated integration code in future projects.
- Wrap signup, signin, refresh, signout, and `me`.
- Provide typed API contracts.

Do not extract the SDK before the backend contract is stable.

## 15. Future OIDC Architecture

VAuth's first version is a reusable central auth API. A full mini-Auth0/Keycloak-style identity provider requires OIDC.

Deferred OIDC endpoints:

```txt
GET  /oauth/authorize
POST /oauth/token
GET  /oauth/userinfo
POST /oauth/introspect
GET  /.well-known/jwks.json
GET  /.well-known/openid-configuration
```

Deferred capabilities:

- Authorization Code with PKCE.
- `id_token`.
- JWKS.
- Key rotation.
- Standard OAuth scopes.
- Central browser SSO session.

Do not claim VAuth is an OIDC provider until these are implemented.

## 16. Security Architecture

Non-negotiables:

- Never commit real database URLs, OAuth secrets, JWT secrets, session secrets, or client secrets.
- Rotate any credential pasted into notes, chat, commits, or screenshots.
- Use Argon2id for passwords, refresh tokens, and client secrets.
- Use separate secrets for access and refresh tokens.
- Validate `clientId`.
- Validate `redirectUri`.
- Validate request origin where applicable.
- Enforce app scope on every protected app-specific route.
- Do not store tokens in browser-readable storage.
- Use HTTP-only, secure, SameSite cookies for frontend sessions.
- Add rate limiting to auth endpoints.
- Add audit logs for auth and authorization events.

Security events to audit:

- Signup.
- Signin success.
- Signin failure.
- Refresh success.
- Refresh reuse detected.
- Signout.
- OAuth login.
- Role changes.
- Permission changes.
- Membership changes.
- Client app changes.
