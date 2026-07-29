# VAuth

VAuth is a reusable authentication platform built as a Turborepo monorepo.

The backend in `apps/api` is the product: it owns users, credentials, client
apps, app-scoped roles and permissions, JWT access tokens, rotating refresh
tokens, Google OAuth linking, and audit logs.

The frontend in `apps/web` is a reference client that consumes VAuth through
HTTP APIs and stores sessions in encrypted HTTP-only cookies.

## Workspaces

- `apps/api`: NestJS VAuth backend.
- `apps/web`: Next.js demo/reference client.
- `packages/auth-client`: typed VAuth HTTP client for future apps.
- `packages/ui`: existing shared UI package.
- `context`: architecture, build plan, standards, and progress tracker.
- `context/client_onboarding.md`: guide for integrating another app with VAuth.

## Setup

```sh
npm install
```

Create local env files from:

```txt
apps/api/.env.example
apps/web/.env.example
```

Do not commit real `.env` files or secrets.

## Database

Phase 1 created the auth-first Prisma schema and a reset migration:

```txt
apps/api/prisma/migrations/20260728171600_auth_platform_schema
```

That migration drops the scaffold blog tables. Review the target database before
applying it anywhere that may contain data.

```sh
cd apps/api
npm exec -- prisma generate
npm exec -- prisma migrate dev
npm run db:seed
```

## Client Onboarding

Use [context/client_onboarding.md](context/client_onboarding.md) when connecting
another app. The current OAuth callback contract redirects with a one-time
`code`; exchange it server-side through `POST /auth/oauth/exchange` before
creating the frontend session.

## Development

```sh
npm run dev
```

API defaults to `http://localhost:8000`.
Web defaults to `http://localhost:3000`.

## Verification

```sh
npm run check-types
npm run build
cd apps/api
npm test
```
