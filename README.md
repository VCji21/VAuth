# VAuth

VAuth is a reusable authentication and authorization platform built with NestJS,
Next.js, Prisma, PostgreSQL, and Turborepo.

It is designed to be built once and reused across many apps. The backend is the
core product: it owns users, credentials, registered client apps, memberships,
roles, permissions, tokens, OAuth, revocation, and audit events. The frontend is
a demo/reference client that proves another app can consume VAuth safely.

```txt
Project A
Project B
Project C
  -> authenticate through VAuth
  -> define their own roles and permissions
  -> receive app-scoped access and refresh tokens
```

## What VAuth Provides

- Registered client apps with `clientId`, allowed origins, and redirect URIs.
- App-scoped users and memberships.
- Dynamic database-backed roles per app.
- Dynamic database-backed permissions per app.
- Email/password signup and signin.
- Argon2id password hashing.
- Google OAuth login.
- Short-lived app-scoped JWT access tokens.
- Rotating hashed refresh tokens.
- Refresh token reuse detection and revocation.
- Current-session and all-session signout.
- Protected-by-default NestJS API routes.
- Backend-enforced role and permission guards.
- Audit logging for security and admin events.
- A Next.js reference client with encrypted HTTP-only sessions.
- A typed `@repo/auth-client` package for consuming VAuth APIs.

VAuth is not a full OIDC provider yet. OAuth2/OIDC provider endpoints such as
authorization code with PKCE, JWKS, `id_token`, and discovery metadata are
tracked as future work.

## Repository Layout

```txt
apps/api
  NestJS VAuth backend
  Prisma schema, migrations, auth APIs, roles, permissions, OAuth, tokens

apps/web
  Next.js reference client
  signup/signin UI, protected pages, encrypted session cookie, Google callback

packages/auth-client
  typed VAuth HTTP client for frontend apps and future consumers

packages/ui
  shared presentational UI components

packages/eslint-config
packages/typescript-config
  shared workspace tooling

context
  project architecture, build plan, frontend integration notes, tracker
```

## Requirements

- Node.js `>=18`
- npm `>=11.11.0`
- PostgreSQL database
- Google OAuth credentials, only if you want Google sign-in locally

The project currently uses Prisma 7 with `@prisma/adapter-pg`, so the API needs a
valid PostgreSQL `DATABASE_URL`.

## Setup

Install dependencies from the repository root:

```sh
npm install
```

Create the API environment file:

```sh
cp apps/api/.env.example apps/api/.env
```

Fill `apps/api/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=verify-full"
API_PORT=8000
WEB_APP_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000"

JWT_ACCESS_SECRET="replace-with-a-long-random-access-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="replace-with-a-long-random-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

GOOGLE_CLIENT_ID="replace-with-google-client-id"
GOOGLE_CLIENT_SECRET="replace-with-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:8000/auth/google/callback"
OAUTH_STATE_SECRET="replace-with-a-long-random-oauth-state-secret"
```

For email/password auth only, Google values can remain unset. If Google OAuth is
enabled, configure the Google callback URL in your Google Cloud OAuth client.

Create the web environment file:

```sh
cp apps/web/.env.example apps/web/.env
```

Fill `apps/web/.env`:

```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_CLIENT_ID="vauth_demo_web"
SESSION_SECRET="replace-with-at-least-32-random-characters"
```

`NEXT_PUBLIC_CLIENT_ID` is public. `SESSION_SECRET`, JWT secrets, refresh tokens,
client secrets, and OAuth secrets must stay private.

## Database Setup

Run Prisma commands from `apps/api`:

```sh
cd apps/api
npm exec -- prisma generate
npm exec -- prisma migrate dev
npm run db:seed
```

The seed creates a demo client app:

```txt
clientId: vauth_demo_web
allowedOrigins:
  - http://localhost:3000
redirectUris:
  - http://localhost:3000/auth/callback
roles:
  - owner
  - admin
  - member
permissions:
  - profile:read
  - profile:update
  - admin:read
  - roles:manage
  - members:manage
  - clients:manage
```

## Run Locally

From the repository root, start all workspace dev servers:

```sh
npm run dev
```

Default local URLs:

```txt
API: http://localhost:8000
Web: http://localhost:3000
```

You can also run an individual app:

```sh
npm run dev --workspace api
npm run dev --workspace web
```

Build the reusable auth client before consuming it from a clean workspace:

```sh
npm run build --workspace @repo/auth-client
```

## Verify

Run workspace checks from the root:

```sh
npm run check-types
npm run build
```

Run package-specific tests:

```sh
npm test --workspace api
npm run test:e2e --workspace api
npm test --workspace web
npm test --workspace @repo/auth-client
```

## How Authentication Works

### Email Signup

1. A client app submits `name`, `email`, `password`, and `clientId`.
2. VAuth validates the registered client app.
3. VAuth creates the user and stores the password as an Argon2id hash.
4. VAuth creates an app membership and assigns the default app role.
5. VAuth returns an app-scoped access token and refresh token.
6. The frontend stores the session in an encrypted HTTP-only cookie.

### Email Signin

1. A client app submits `email`, `password`, and `clientId`.
2. VAuth validates the credential.
3. VAuth loads the user's membership, roles, and permissions for that app.
4. VAuth returns an app-scoped token pair.
5. The frontend stores the session securely.

### Refresh

1. The frontend calls protected APIs with the access token.
2. If the access token expires, the frontend sends the refresh token to VAuth.
3. VAuth verifies the refresh token and checks its stored hash.
4. VAuth revokes the old refresh token and returns a new token pair.
5. If token reuse is detected, VAuth revokes the token family.

### Signout

1. The frontend submits the current refresh token to VAuth.
2. VAuth revokes the current refresh token, or all sessions for that user/app
   when requested.
3. The frontend deletes the encrypted session cookie.

### Google OAuth

1. The frontend redirects the browser to:

   ```txt
   GET {API_URL}/auth/google?clientId={CLIENT_ID}&redirectUri={CALLBACK_URL}
   ```

2. VAuth validates OAuth state, `clientId`, and `redirectUri`.
3. Google redirects back to VAuth.
4. VAuth creates or links the external Google account.
5. VAuth redirects to the frontend callback with a short-lived one-time `code`.
6. The frontend exchanges that code server-side with VAuth.
7. VAuth returns app-scoped tokens, which the frontend stores server-side.

VAuth tokens are never placed in OAuth callback query parameters.

## API Surface

Core auth endpoints:

```txt
POST /auth/signup
POST /auth/signin
POST /auth/refresh
POST /auth/signout
GET  /auth/me
GET  /auth/google
GET  /auth/google/callback
POST /auth/oauth/exchange
GET  /health
```

Client app endpoints:

```txt
POST   /clients
GET    /clients
GET    /clients/:id
PATCH  /clients/:id
DELETE /clients/:id
```

Access-control endpoints:

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

Protected routes require:

```txt
Authorization: Bearer <accessToken>
```

Auth requests must include the target app's `clientId`.

## Using VAuth from Another App

Every consuming app must first be registered as a `ClientApp` with:

- a public `clientId`,
- allowed browser origins,
- exact OAuth redirect URIs,
- app-specific roles,
- app-specific permissions.

Workspace consumers can use the typed client:

```ts
import { createAuthClient } from "@repo/auth-client";

const auth = createAuthClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID ?? "vauth_demo_web",
});

const session = await auth.signIn({ email, password });
```

The client wraps HTTP contracts only. Your app still owns:

- form UI and validation,
- encrypted server-side session storage,
- route redirects,
- cookie creation and deletion,
- calling refresh server-side,
- keeping tokens out of browser-readable storage.

## Security Model

VAuth follows these rules:

- Passwords are never stored in plaintext.
- Refresh tokens are never stored raw.
- Client secret hashes and token hashes are never exposed.
- Access and refresh tokens are scoped to one app.
- A token issued for one app cannot authorize another app.
- Frontend permission checks are UX only.
- Backend guards are the source of truth for authorization.
- Browser-readable token storage such as `localStorage` is forbidden.
- The demo client uses encrypted HTTP-only cookies for sessions.

Current local abuse protection uses Nest throttling and process-local repeated
signin tracking. Production multi-instance or serverless deployments should add
shared storage before relying on those limits.

## Demo Web App

The reference client includes:

```txt
/signin
/signup
/dashboard
/profile
/admin
/auth/callback
```

It demonstrates:

- email signup and signin through VAuth,
- Google OAuth callback code exchange,
- encrypted HTTP-only session cookies,
- protected page redirects,
- server-side token refresh through `authFetch`,
- admin UX checks based on app-scoped permissions.

The frontend does not read the database and does not implement backend auth
business logic.

## Current Limitations

Out of scope for the first version:

- full OIDC provider mode,
- SAML,
- MFA,
- passkeys/WebAuthn,
- email verification,
- password reset,
- hosted public auth pages for arbitrary clients,
- organization/team billing,
- production shared throttling storage,
- multi-region deployment.

These are deferred so the core reusable auth platform can stay small, stable,
and understandable.

## More Documentation

- `context/project_overview.md`: product scope and success criteria.
- `context/architecture.md`: backend, token, domain, and authorization design.
- `context/frontend_integration.md`: how frontend apps consume VAuth safely.
- `context/client_onboarding.md`: concrete steps for integrating another app.
- `apps/api/README.md`: backend-specific setup and verification.
- `apps/web/README.md`: demo client setup and verification.
- `packages/auth-client/README.md`: typed client usage.
