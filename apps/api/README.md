# VAuth API

NestJS backend for the VAuth authentication platform.

## Current Capabilities

- Auth-first Prisma schema.
- Registered client apps with redirect URI and allowed origin validation.
- Database-backed app-scoped roles and permissions.
- Email/password signup and signin with Argon2id password hashes.
- JWT access tokens and rotating hashed refresh tokens.
- Refresh reuse detection and current/all-session signout revocation.
- Protected-by-default API guard with `@Public()`.
- Permission and role guards.
- Google OAuth scaffold with signed state, one-time callback code exchange, and external account linking.
- Basic rate limiting and repeated signin failure throttling on public auth endpoints.
- Public `GET /health`.

## Env

Copy `.env.example` to `.env` and fill placeholders.

Required core values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=verify-full"
API_PORT=8000
WEB_APP_URL="http://localhost:3000"
JWT_ACCESS_SECRET=""
JWT_REFRESH_SECRET=""
```

Google OAuth is fail-closed. Set `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` before starting the API when
the Google OAuth module is enabled.

OAuth callback redirects now return `?code=` to the registered client callback.
Exchange that code server-side with `POST /auth/oauth/exchange`.

Rate limiting and repeated signin failure tracking currently use process-local
memory. This is acceptable for local/single-instance runs. Multi-instance or
serverless production deployments need shared storage before relying on those
limits.

## Prisma

Prisma 7 uses `@prisma/adapter-pg`; `PrismaService` constructs the client with
that adapter from `DATABASE_URL`.

```sh
npm exec -- prisma generate
npm exec -- prisma migrate dev
npm run db:seed
```

The Phase 1 migration resets the scaffold schema and drops old blog tables.
Review any real database before applying it.

## Run

```sh
npm run dev
```

## Verify

```sh
npm run build
npm test
```
