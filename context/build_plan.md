# Build Plan: VAuth

This document organizes what to build and in what order.

For the first-read agent guide, read `context/agent_start_here.md`.

For system design and architecture decisions, read `context/architecture.md`.

For product scope and user-facing flows, read `context/project_overview.md`.

For implementation rules, read `context/code_standards.md`.

For library-specific usage, read `context/library_docs.md`.

For demo client UI consistency, read `context/ui_system.md`.

For frontend auth consumption patterns, read `context/frontend_integration.md`.

Track completion in `context/progress_tracker.md`.

## 1. Build Objective

Build VAuth as a reusable authentication platform with:

- NestJS backend as the main product.
- Next.js frontend as a reference client.
- Auth-first Prisma schema.
- Registered client apps.
- App-scoped roles and permissions.
- Password signup/signin.
- Google OAuth.
- JWT access tokens.
- Rotating refresh tokens.
- Revocation.
- Protected APIs by default.
- Demo frontend session flow.

## 2. Build Principles

Follow these while implementing:

- Backend first.
- Frontend proves consumption only.
- Every auth request includes app context.
- Roles and permissions are dynamic database rows.
- Tokens are scoped to one app.
- Refresh tokens are stored only as hashes.
- Authorization is enforced in the backend.
- Each phase should be independently verifiable.

## 3. Phase 0: Documentation and Alignment

Status: Complete

Deliverables:

- `context/architecture.md`
- `context/agent_start_here.md`
- `context/build_plan.md`
- `context/code_standards.md`
- `context/library_docs.md`
- `context/ui_system.md`
- `context/frontend_integration.md`
- `context/progress_tracker.md`

Tasks:

- [x] Define product goal.
- [x] Define modular monolith direction.
- [x] Define backend/frontend ownership.
- [x] Define app-scoped dynamic roles.
- [x] Define implementation standards.
- [x] Define library usage rules.
- [x] Define progress tracking process.
- [x] Split architecture from build plan.
- [x] Define demo client UI system.
- [x] Define frontend VAuth integration patterns.

Verification:

- [x] Planning docs exist in `context/`.

## 4. Phase 1: Reset Domain to Authenticator

Status: Complete

Goal:

Replace the scaffold/blog-shaped Prisma schema with the auth-first VAuth domain.

Deliverables:

- Updated `apps/api/prisma/schema.prisma`.
- New Prisma migration.
- Generated Prisma client.

Tasks:

- [x] Remove `Post`.
- [x] Remove `Comment`.
- [x] Remove `Category`.
- [x] Remove blog relations from `User`.
- [x] Remove fixed Prisma `Role` enum.
- [x] Add `User`.
- [x] Add `Credential`.
- [x] Add `ExternalAccount`.
- [x] Add `ClientApp`.
- [x] Add `AppMembership`.
- [x] Add database-backed `Role`.
- [x] Add database-backed `Permission`.
- [x] Add `UserRole`.
- [x] Add `RolePermission`.
- [x] Add `RefreshToken`.
- [x] Add `AuditLog`.
- [x] Add required enums: `UserStatus`, `AppStatus`, `OAuthProvider`.
- [x] Add uniqueness constraints for app-scoped roles and permissions.
- [x] Create migration.
- [x] Run Prisma generate.

Suggested commands:

```bash
cd mono_auth/apps/api
npx prisma migrate dev --name auth_platform_schema
npx prisma generate
```

Acceptance:

- [x] Prisma schema contains no blog-domain models.
- [x] Roles are database-backed and app-scoped.
- [x] Permissions are database-backed and app-scoped.
- [x] Membership is unique per user/app.
- [x] Prisma client generates successfully.

## 5. Phase 2: Backend Foundation

Status: Complete

Goal:

Prepare the NestJS backend for secure, validated, modular auth work.

Deliverables:

- `ConfigModule`
- `PrismaModule`
- `HealthModule`
- Secure bootstrap setup.
- Backend `.env.example`.

Tasks:

- [x] Fix `apps/api/src/main.ts` so global pipes are registered before `app.listen(...)`.
- [x] Install foundation dependencies.
- [x] Add `@nestjs/config`.
- [x] Add env validation.
- [x] Add `PrismaModule`.
- [x] Move Prisma provider ownership into `PrismaModule`.
- [x] Add `HealthModule`.
- [x] Add public `GET /health`.
- [x] Add CORS setup.
- [x] Add `helmet`.
- [x] Add backend `.env.example`.
- [x] Confirm API runs on configured port.

Suggested dependencies:

```bash
cd mono_auth/apps/api
npm install @nestjs/config helmet
```

Acceptance:

- [x] API starts cleanly.
- [x] `/health` works without authentication.
- [x] Global validation rejects unknown DTO fields.
- [x] Missing required env values fail at startup.
- [x] Prisma service is imported through `PrismaModule`.

## 6. Phase 3: Client App Management

Status: Complete

Goal:

Allow projects to register as VAuth client apps.

Deliverables:

- `ClientsModule`
- Client app CRUD or management API.
- Demo client seed data.

Tasks:

- [x] Create `clients` module.
- [x] Create `clients.controller.ts`.
- [x] Create `clients.service.ts`.
- [x] Add DTO for creating client app.
- [x] Add DTO for updating client app.
- [x] Implement create client app.
- [x] Implement list client apps.
- [x] Implement get client app.
- [x] Implement update client app.
- [x] Implement disable/delete policy.
- [x] Validate allowed origins.
- [x] Validate redirect URIs.
- [x] Hash client secret when used.
- [x] Add seed script for `vauth_demo_web`.
- [x] Seed default roles and permissions for demo app.

Acceptance:

- [x] A client app can be created.
- [x] A client app can be disabled.
- [x] Client app has unique `clientId`.
- [x] Redirect URIs are stored and validated.
- [x] Allowed origins are stored and validated.
- [x] Demo client exists after seed.

## 7. Phase 4: Identity and Signup

Status: Complete

Goal:

Create users, credentials, app memberships, and default role assignments.

Deliverables:

- `IdentityModule`
- Signup DTO.
- `POST /auth/signup`
- Signup audit event.

Tasks:

- [x] Create `identity` module.
- [x] Implement user lookup by email.
- [x] Implement user creation.
- [x] Implement credential creation.
- [x] Install Argon2.
- [x] Hash password with Argon2id.
- [x] Validate target `clientId`.
- [x] Create app membership during signup.
- [x] Assign app default role.
- [x] Use transaction for user, credential, membership, role, and audit writes.
- [x] Add signup audit log.
- [x] Return sanitized response.

Suggested dependencies:

```bash
cd mono_auth/apps/api
npm install argon2
```

Acceptance:

- [x] Signup creates a user.
- [x] Signup creates a password credential.
- [x] Signup creates app membership.
- [x] Signup assigns default app role.
- [x] Duplicate email is handled safely.
- [x] Password hash is never returned.

## 8. Phase 5: Signin and Token Issuance

Status: Complete

Goal:

Authenticate existing users and issue app-scoped token pairs.

Deliverables:

- Signin DTO.
- `TokenService`.
- `POST /auth/signin`.
- Stored hashed refresh token.

Tasks:

- [x] Install JWT/passport dependencies.
- [x] Add signin DTO.
- [x] Validate `clientId`.
- [x] Validate user status.
- [x] Validate password through Argon2.
- [x] Load app membership.
- [x] Load membership roles.
- [x] Load membership permissions.
- [x] Implement access token signing.
- [x] Implement refresh token signing.
- [x] Generate refresh token family ID.
- [x] Hash refresh token.
- [x] Store refresh token record.
- [x] Add signin audit log.
- [x] Return sanitized user plus token pair.

Suggested dependencies:

```bash
cd mono_auth/apps/api
npm install @nestjs/passport @nestjs/jwt passport passport-local passport-jwt
npm install -D @types/passport-local @types/passport-jwt
```

Acceptance:

- [x] Valid signin returns access token and refresh token.
- [x] Invalid signin returns generic auth error.
- [x] Access token includes `sub`, `email`, `appId`, `clientId`, roles, and permissions.
- [x] Token roles and permissions belong only to requested app.
- [x] Refresh token is stored only as a hash.

## 9. Phase 6: Refresh, Rotation, and Revocation

Status: Complete

Goal:

Keep users signed in safely while supporting revocation.

Deliverables:

- `POST /auth/refresh`
- `POST /auth/signout`
- Refresh token rotation.
- Token family reuse detection.

Tasks:

- [x] Add refresh DTO.
- [x] Add refresh token verification flow.
- [x] Verify refresh token signature.
- [x] Verify refresh token app scope.
- [x] Load matching refresh token record.
- [x] Verify refresh token hash.
- [x] Rotate refresh token on success.
- [x] Revoke previous refresh token.
- [x] Detect token reuse.
- [x] Revoke token family on reuse.
- [x] Implement current-session signout.
- [x] Implement all-sessions signout for user/app.
- [x] Add refresh audit log.
- [x] Add signout audit log.

Acceptance:

- [x] Refresh returns a new token pair.
- [x] Old refresh token cannot be reused.
- [x] Reuse detection revokes the token family.
- [x] Signout prevents later refresh.
- [x] Refresh token for one app cannot refresh another app.

## 10. Phase 7: Global Guards and App-Scoped Authorization

Status: Complete

Goal:

Protect APIs by default and enforce dynamic app-scoped authorization.

Deliverables:

- `@Public()`
- `@CurrentUser()`
- `@CurrentClient()`
- `@RequirePermissions(...)`
- `@RequireRoles(...)`
- JWT guard.
- Permission guard.

Tasks:

- [x] Add auth decorators.
- [x] Add JWT strategy.
- [x] Add global JWT guard.
- [x] Mark public auth and health routes with `@Public()`.
- [x] Add permission metadata decorator.
- [x] Add role metadata decorator.
- [x] Add permission guard.
- [x] Add optional role guard.
- [x] Enforce app scope in guards.
- [x] Protect client management routes.
- [x] Protect role routes.
- [x] Protect permission routes.
- [x] Protect membership routes.

Acceptance:

- [x] APIs are protected by default.
- [x] Public routes work without access token.
- [x] Protected routes reject missing tokens.
- [x] Permission checks are app-scoped.
- [x] Role checks are database-driven.
- [x] Token for one app cannot authorize routes for another app.

## 11. Phase 8: Google OAuth

Status: Complete

Goal:

Allow users to authenticate through Google while still receiving VAuth app-scoped tokens.

Deliverables:

- Google OAuth strategy.
- OAuth state validation.
- `ExternalAccount` linking.
- App-scoped token issuance after Google login.

Tasks:

- [x] Install Google OAuth dependencies.
- [x] Add Google strategy.
- [x] Add OAuth start route.
- [x] Add OAuth callback route.
- [x] Sign or otherwise protect OAuth state.
- [x] Include `clientId` in OAuth state.
- [x] Include `redirectUri` in OAuth state.
- [x] Validate callback `redirectUri` against client app.
- [x] Find or create user.
- [x] Create or link `ExternalAccount`.
- [x] Create app membership when policy allows.
- [x] Assign default role.
- [x] Issue app-scoped VAuth tokens through one-time callback code exchange.
- [x] Redirect to client callback with code only.
- [x] Add OAuth audit log.
- [x] Make OAuth callback code consumption atomic under concurrent exchange requests.
- [x] Return a controlled configuration error when Google OAuth env values are missing.
- [x] Verify live Google login in a browser with approved Google Cloud credentials and callback URL.

Suggested dependencies:

```bash
cd mono_auth/apps/api
npm install passport-google-oauth20
npm install -D @types/passport-google-oauth20
```

Acceptance:

- [x] Google login works for demo client with approved Google Cloud credentials and callback URL.
- [x] Invalid redirect URI is rejected.
- [x] OAuth user receives app-scoped membership.
- [x] Google tokens are not treated as VAuth tokens.
- [x] VAuth access and refresh tokens are not sent in OAuth callback query params.

Current note:

- Backend OAuth behavior is locally verified, including one-time callback code exchange, concurrent reuse rejection, and fail-closed Google config handling. Live browser verification against approved Google OAuth credentials and registered callback URL is also confirmed by the user.

## 12. Phase 9: Demo Next.js Client

Status: Complete

Goal:

Build a reference app that consumes VAuth like an external project.

Deliverables:

- Signup page.
- Signin page.
- OAuth callback handler.
- Encrypted session cookie.
- Protected demo pages.
- `authFetch`.
- Middleware.

Tasks:

- [x] Add frontend env values.
- [x] Install frontend auth dependencies.
- [x] Add UI tokens to global CSS.
- [x] Create required UI foundation components.
- [x] Add session encryption helpers.
- [x] Add session read helper.
- [x] Add session write helper.
- [x] Add session delete helper.
- [x] Add signup form.
- [x] Add signin form.
- [x] Add form schemas.
- [x] Add server actions.
- [x] Pass configured `clientId` with auth requests.
- [x] Add `/auth/callback` route handler.
- [x] Add `authFetch`.
- [x] Add silent refresh retry.
- [x] Add dashboard page.
- [x] Add profile page.
- [x] Add admin page.
- [x] Add middleware/proxy protection.
- [x] Add frontend permission checks for UX.

Suggested dependencies:

```bash
cd mono_auth/apps/web
npm install jose zod
```

Acceptance:

- [x] Demo app signs up through backend API.
- [x] Demo app signs in through backend API.
- [x] Demo app stores encrypted HTTP-only session.
- [x] Demo app silently refreshes tokens.
- [x] Demo app protects pages.
- [x] Tokens are not exposed to client JavaScript.

## 13. Phase 10: Reusable Auth Client Package

Goal:

Extract common client integration code after the demo flow is stable.

Status: Complete

Deliverables:

- `packages/auth-client`
- Typed API helper.
- Package README.

Tasks:

- [x] Create package.
- [x] Add typed client factory.
- [x] Add signup helper.
- [x] Add signin helper.
- [x] Add refresh helper.
- [x] Add signout helper.
- [x] Add `me` helper.
- [x] Add OAuth callback code exchange helper.
- [x] Add package README.
- [x] Add package tests.
- [x] Add package build output or source-resolution strategy for real workspace consumers.
- [x] Replace demo-local helper where useful.

Acceptance:

- [x] SDK contract covers signup, signin, refresh, signout, `me`, and OAuth callback code exchange.
- [x] Real workspace/browser consumers can import the package without custom TypeScript source handling.
- [x] Demo client can use the package without behavior changes.

Decision:

- `packages/auth-client` now builds to `dist` and exports JavaScript/types from build output. The demo consumes it for signup, signin, refresh, signout, and OAuth callback code exchange while keeping encrypted session-cookie ownership in the web app.

## 14. Phase 11: Tests, Documentation, and Hardening

Status: In Progress

Goal:

Prove security-sensitive behavior, document setup/onboarding, and close production hardening gaps.

Deliverables:

- Backend unit tests.
- Backend e2e tests.
- `.env.example` files.
- README updates.
- Client onboarding docs.
- Auth endpoint abuse protection.

Tasks:

- [x] Test signup success.
- [x] Test duplicate signup.
- [x] Test signin success.
- [x] Test signin failure.
- [x] Test protected route without token.
- [x] Test protected route with wrong app token.
- [x] Test refresh success.
- [x] Test refresh reuse failure.
- [x] Test signout revocation.
- [x] Test all-sessions signout.
- [x] Test role allow/deny.
- [x] Test permission allow/deny.
- [x] Test OAuth callback code one-time exchange.
- [x] Test concurrent OAuth callback code exchange.
- [x] Test signin abuse throttling.
- [x] Add root README setup.
- [x] Add API README setup.
- [x] Add web README setup.
- [x] Add `.env.example` files.
- [x] Add seed docs.
- [x] Add client onboarding docs.
- [x] Add auth endpoint rate limiting.
- [x] Add signin abuse throttling.
- [x] Add frontend route/session tests if useful.
- [x] Add shared throttling/signin-attempt storage or document single-instance/local-only limits.
- [x] Replace credential-looking values in env examples with placeholders.
- [x] Scrub local env files of credential-looking values that were exposed during development.
- [x] Rotate any real credentials that were exposed in prior env examples, notes, chat, commits, screenshots, or logs.
- [x] Replace placeholder-like local JWT secrets before any non-local run.
- [x] Verify Google OAuth end to end in a browser with approved Google Cloud credentials and callback URL.
- [x] Review Prisma/pg SSL-mode warning and update connection string if appropriate.
- [x] Triage reported high-severity `npm audit` findings.

Acceptance:

- [x] Tests prove app-scoped role isolation.
- [x] Tests prove token app isolation.
- [x] Tests prove refresh rotation.
- [x] Fresh setup is documented.
- [x] Public auth endpoints have basic abuse protection.
- [x] Production throttling behavior is safe for multi-instance/serverless deployment or explicitly scoped to single-instance use.
- [x] Env examples contain placeholders only.
- [x] Browser Google login has been manually verified.

Current note:

- Frontend route/session coverage now uses Node's built-in test runner for encrypted session behavior and pure proxy route-policy decisions. Local JWT/OAuth state secrets were regenerated. User confirmed external provider-side credential rotation and live Google OAuth browser verification are complete. Live `npm audit` was triaged: Next was safely patched to 16.2.12, but remaining high advisories require upstream Next dependency updates or breaking/unsafe forced changes.

## 15. Phase 12: OIDC Provider Expansion

Goal:

Upgrade VAuth from central auth API to standards-compatible OAuth/OIDC provider.

Status: Deferred until the core VAuth API is stable.

Deliverables:

- Authorization server module.
- OIDC discovery.
- JWKS.
- Authorization Code with PKCE.
- `id_token`.

Tasks:

- [ ] Design authorization code storage.
- [ ] Add PKCE verifier/challenge support.
- [ ] Add `/oauth/authorize`.
- [ ] Add `/oauth/token`.
- [ ] Add `/oauth/userinfo`.
- [ ] Add `/oauth/introspect`.
- [ ] Add `/.well-known/jwks.json`.
- [ ] Add `/.well-known/openid-configuration`.
- [ ] Add asymmetric signing keys.
- [ ] Add key rotation.
- [ ] Add OIDC e2e tests.

Acceptance:

- [ ] VAuth acts as an OIDC provider.
- [ ] External apps can integrate using standard OAuth/OIDC flows.

## 16. Seed Data Build Target

Create local seed data for the demo client.

Seed:

```txt
Client app:
  name: VAuth Demo Web
  slug: vauth-demo-web
  clientId: vauth_demo_web
  allowedOrigins:
    - http://localhost:3000
  redirectUris:
    - http://localhost:3000/auth/callback

Roles:
  owner
  admin
  member

Permissions:
  profile:read
  profile:update
  admin:read
  roles:manage
  members:manage

Role permissions:
  owner -> all permissions
  admin -> profile:read, admin:read, members:manage
  member -> profile:read, profile:update
```

## 17. Recommended Build Order

Original build order:

```txt
1. Replace Prisma schema with auth-first models.
2. Add config, Prisma module, validation, health route, CORS, and security foundation.
3. Implement client app management and seed the demo app.
4. Implement identity and password signup.
5. Implement signin and app-scoped token issuance.
6. Implement refresh token rotation and signout revocation.
7. Add global JWT protection and public routes.
8. Add dynamic roles, permissions, memberships, and guards.
9. Add Google OAuth with app-scoped callback validation and one-time callback code exchange.
10. Build the Next.js demo client around the backend API.
11. Extract `packages/auth-client` after the demo flow is stable and ship built package output for consumers.
12. Add tests, seed docs, and hardening.
13. Add OIDC provider features later.
```

Current remaining order:

```txt
1. Decide whether production auth throttling needs Redis/shared storage before launch.
2. Track upstream safe fixes for remaining npm audit advisories; avoid `npm audit fix --force` unless intentionally accepting breaking toolchain changes.
3. Keep OIDC provider work deferred until the current VAuth API is production-ready.
```

## 18. Per-Session Build Routine

Before coding:

1. Read `context/agent_start_here.md`.
2. Read `context/project_overview.md`.
3. Read `context/architecture.md`.
4. Read `context/build_plan.md`.
5. Read `context/code_standards.md`.
6. Read `context/library_docs.md`.
7. Read `context/ui_system.md` before frontend UI work.
8. Read `context/frontend_integration.md` before frontend auth/session work.
9. Read `context/progress_tracker.md`.

During coding:

1. Work on the current phase only unless a dependency requires earlier cleanup.
2. Keep changes scoped.
3. Update tests for auth-sensitive behavior.
4. Update docs if contracts, env, schema, or flow changes.

Before finishing:

1. Run relevant verification commands when feasible.
2. Update `context/progress_tracker.md`.
3. Record decisions in the tracker.
4. Record blockers or open questions.
