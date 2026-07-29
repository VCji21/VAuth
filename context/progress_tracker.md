# Progress Tracker: VAuth

This is the living implementation tracker for VAuth.

Update this file during every coding session. It records what has been completed, what is in progress, decisions made during the build, blockers, verification results, and extra notes that may not belong in the architecture documents.

## 1. Current Status

Overall status: Core VAuth implementation built and verified by current type, build, unit, SDK, Prisma validation, backend e2e checks, frontend route/session tests, and manual live Google OAuth browser verification. Remaining work is production deployment decisions and upstream/breaking-change dependency audit follow-up.

Current phase: Phase 11 production-readiness follow-through; Phase 8 is complete.

Current focus:

- Auth-first Prisma schema, migrations, generated Prisma client, and demo seed data are in place.
- Backend foundation, client app management, signup, signin, refresh/signout, all-session signout, guards, Google OAuth scaffold, atomic callback code exchange, throttling, and access-control APIs are implemented.
- Demo Next.js client has encrypted HTTP-only sessions, auth forms, SDK-backed auth calls, OAuth code callback handling, protected pages, middleware/proxy route protection, and admin UX checks.
- `packages/auth-client` exists as a typed reusable HTTP client with build output and tests.
- Phase 1 reset migration and OAuth callback-code migration have been applied to the reviewed Neon development database.
- Backend e2e coverage verifies signup, duplicate signup, signin, protected routes, app isolation, refresh rotation/reuse, current-session signout, all-session signout, role checks, permission checks, one-time OAuth code exchange, and signin abuse throttling.
- Review follow-ups for all-session signout, OAuth token transport, auth endpoint rate limiting, signin abuse throttling, client onboarding docs, and package tests are implemented and locally verified.
- Review follow-ups for OAuth callback code atomicity, Google OAuth missing-env behavior, credential hygiene in env examples, SSL-mode cleanup, local throttling documentation, SDK build output, and demo SDK consumption are implemented.
- Remaining findings are production shared-storage decision for throttling/signin-attempt tracking and resolving remaining npm audit advisories that require upstream or breaking dependency changes.

Last updated: 2026-07-29

## 2. Status Legend

Use these exact labels:

```txt
Not Started
In Progress
Blocked
Needs Review
Complete
Deferred
```

## 3. Progress Roadmap

| Phase | Area | Status | Notes |
|---|---|---|---|
| 0 | Planning and standards | Complete | Agent guide, project overview, architecture, build plan, code standards, library docs, UI system, frontend integration, and progress tracker created. |
| 1 | Reset domain to authenticator | Complete | Auth-first Prisma schema added; migration applied to reviewed empty scaffold DB; Prisma client generated. |
| 2 | Backend foundation | Complete | Config, Prisma module, validation, health, CORS, helmet, env example. |
| 3 | Client app management | Complete | Client CRUD/disable policy, origin/redirect validation, secret hashing, seed data. |
| 4 | Identity and signup | Complete | Signup creates user, credential, membership, default member role, audit log, token pair. |
| 5 | Signin and token issuance | Complete | Generic signin failure, app membership check, roles/permissions loading, hashed refresh token storage. |
| 6 | Refresh, rotation, revocation | Complete | Refresh verification, rotation, previous token revocation, reuse family revocation, current-session signout, and user/app all-session signout. |
| 7 | Global guards and app-scoped authorization | Complete | `@Public`, current decorators, global JWT/permission/role guards, protected management routes. |
| 8 | Google OAuth | Complete | Google strategy, signed state, redirect validation, external account linking, atomic one-time callback code exchange, fail-closed Google config handling, and live provider/browser verification are complete. |
| 9 | Demo Next.js client | Complete | Forms, encrypted sessions, callback route, authFetch, protected dashboard/profile/admin, proxy protection. |
| 10 | Reusable auth client package | Complete | `packages/auth-client` typed helper package builds to `dist`, has tests, and is consumed by the demo auth flows. |
| 11 | Tests and documentation | In Progress | Backend auth e2e coverage added and passing; README/env/onboarding docs added; auth endpoint abuse protection implemented and documented as local/single-instance. Optional frontend route/session tests and audit triage remain. |
| 12 | OIDC provider expansion | Deferred | Add only after core VAuth API is stable. |

## 4. Phase Checklists

### Phase 0: Planning and Standards

Status: Complete

- [x] Create `context/agent_start_here.md`.
- [x] Create `context/project_overview.md`.
- [x] Create `context/build_plan.md`.
- [x] Create `context/architecture.md`.
- [x] Re-architect project as reusable authentication platform.
- [x] Define modular monolith backend direction.
- [x] Define dynamic app-scoped roles instead of role enum.
- [x] Create `context/code_standards.md`.
- [x] Create `context/library_docs.md`.
- [x] Create `context/ui_system.md`.
- [x] Create `context/frontend_integration.md`.
- [x] Create `context/progress_tracker.md`.
- [x] Split architecture from build execution plan.

### Phase 1: Reset Domain to Authenticator

Status: Complete

- [x] Remove `Post`, `Comment`, and `Category` models from Prisma schema.
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
- [x] Create Prisma migration.
- [x] Run Prisma generate.
- [x] Verify generated Prisma client.

Acceptance:

- [x] Database schema contains no blog-domain tables.
- [x] Roles are database rows scoped to client apps.
- [x] Permissions are database rows scoped to client apps.
- [x] Prisma client generates successfully.

### Phase 2: Backend Foundation

Status: Complete

- [x] Fix `main.ts` so global validation pipes are registered before `app.listen(...)`.
- [x] Add `@nestjs/config`.
- [x] Add environment validation.
- [x] Add `PrismaModule`.
- [x] Add `HealthModule`.
- [x] Add public `/health` endpoint.
- [x] Add intentional CORS setup.
- [x] Add `helmet`.
- [x] Add backend `.env.example`.

Acceptance:

- [x] API starts cleanly.
- [x] `/health` works without authentication.
- [x] Invalid DTO fields are rejected.
- [x] Required missing env values fail fast.

### Phase 3: Client App Management

Status: Complete

- [x] Implement `ClientsModule`.
- [x] Implement create client app.
- [x] Implement list client apps.
- [x] Implement get client app.
- [x] Implement update client app.
- [x] Implement disable/delete client app policy.
- [x] Hash client secrets when used.
- [x] Validate redirect URIs.
- [x] Validate allowed origins.
- [x] Seed first demo client app: `vauth_demo_web`.

Acceptance:

- [x] Client app can be created.
- [x] Client app can define allowed origins.
- [x] Client app can define redirect URIs.
- [x] Disabled client apps cannot authenticate.

### Phase 4: Identity and Signup

Status: Complete

- [x] Implement `IdentityModule`.
- [x] Implement user lookup by email.
- [x] Implement user creation.
- [x] Implement credential creation.
- [x] Hash password with Argon2id.
- [x] Implement app membership creation.
- [x] Assign default role for target app.
- [x] Record signup audit event.
- [x] Implement `POST /auth/signup`.

Acceptance:

- [x] Signup creates user.
- [x] Signup creates credential.
- [x] Signup creates app membership.
- [x] Signup assigns default role.
- [x] Duplicate email is handled safely.
- [x] Response does not include sensitive fields.

### Phase 5: Signin and Token Issuance

Status: Complete

- [x] Add `TokenService`.
- [x] Add signin DTO.
- [x] Implement credential validation.
- [x] Load app-specific membership.
- [x] Load app-specific roles.
- [x] Load app-specific permissions.
- [x] Issue access token.
- [x] Issue refresh token.
- [x] Hash and store refresh token.
- [x] Record signin audit event.
- [x] Implement `POST /auth/signin`.

Acceptance:

- [x] Valid signin returns sanitized user and token pair.
- [x] Invalid signin returns safe generic error.
- [x] Access token includes `appId` and `clientId`.
- [x] Token roles and permissions belong only to requested app.
- [x] Refresh token hash is stored, not raw token.

### Phase 6: Refresh, Rotation, and Revocation

Status: Complete

- [x] Add refresh token strategy or verification flow.
- [x] Add refresh DTO.
- [x] Validate refresh token signature.
- [x] Verify refresh token hash.
- [x] Rotate refresh token on success.
- [x] Add token family ID handling.
- [x] Detect refresh token reuse.
- [x] Revoke token family on reuse.
- [x] Implement current-session signout.
- [x] Implement optional all-sessions signout for user/app.
- [x] Record refresh/signout audit events.

Acceptance:

- [x] Refresh returns new token pair.
- [x] Old refresh token cannot be reused.
- [x] Reuse detection revokes token family.
- [x] Signout prevents further refresh.
- [x] Refresh tokens cannot cross app boundaries.

### Phase 7: Global Guards and App-Scoped Authorization

Status: Complete

- [x] Add `@Public()` decorator.
- [x] Add `@CurrentUser()` decorator.
- [x] Add `@CurrentClient()` decorator.
- [x] Add `@RequirePermissions(...)` decorator.
- [x] Add `@RequireRoles(...)` decorator.
- [x] Add JWT strategy.
- [x] Add global JWT guard.
- [x] Add permission guard.
- [x] Add role guard if still useful for simple routes.
- [x] Protect client management routes.
- [x] Protect role/permission routes.
- [x] Protect membership routes.

Acceptance:

- [x] APIs are protected by default.
- [x] Public routes work without access token.
- [x] Permission checks are app-scoped.
- [x] Role checks are database-driven.
- [x] Token for one app cannot authorize another app.

### Phase 8: Google OAuth

Status: In Progress

- [x] Add Google OAuth dependencies.
- [x] Add Google strategy.
- [x] Add OAuth state signing/validation.
- [x] Include `clientId` in OAuth state.
- [x] Include `redirectUri` in OAuth state.
- [x] Validate redirect URI against client app.
- [x] Create or link `ExternalAccount`.
- [x] Create app membership when policy allows.
- [x] Assign default role for OAuth user.
- [x] Issue app-scoped tokens through one-time callback code exchange.
- [x] Redirect to client callback with code only.
- [x] Record OAuth audit event.
- [x] Make OAuth callback code consumption atomic under concurrent exchange requests.
- [x] Return a controlled configuration error when Google OAuth env values are missing.
- [x] Verify live Google login in a browser with approved Google Cloud credentials and callback URL.

Acceptance:

- [x] Google login works for demo client with approved Google Cloud credentials and callback URL.
- [x] Invalid redirect URI is rejected.
- [x] OAuth-created user has app-scoped membership.
- [x] OAuth tokens are VAuth tokens, not Google tokens.
- [x] VAuth access and refresh tokens are not sent in OAuth callback query params.

### Phase 9: Demo Next.js Client

Status: Complete

- [x] Add frontend env values.
- [x] Add session encryption helpers.
- [x] Add signup form.
- [x] Add signin form.
- [x] Add server actions.
- [x] Add form validation.
- [x] Add session cookie creation.
- [x] Add session cookie update.
- [x] Add session cookie deletion.
- [x] Add `authFetch`.
- [x] Add silent refresh retry.
- [x] Add `/auth/callback` route handler.
- [x] Add dashboard page.
- [x] Add profile page.
- [x] Add admin page.
- [x] Add middleware/proxy route protection.
- [x] Add frontend permission checks for UX.

Acceptance:

- [x] Demo app signs up through backend API.
- [x] Demo app signs in through backend API.
- [x] Demo app stores encrypted HTTP-only session.
- [x] Demo app silently refreshes tokens.
- [x] Demo app protects pages.
- [x] Demo app does not expose tokens to client JavaScript.

### Phase 10: Reusable Auth Client Package

Status: Complete

- [x] Create `packages/auth-client`.
- [x] Add typed API client.
- [x] Add signin helper.
- [x] Add signup helper.
- [x] Add refresh helper.
- [x] Add signout helper.
- [x] Add `me` helper.
- [x] Add OAuth callback code exchange helper.
- [x] Add package README.
- [x] Add package tests.
- [x] Add package build output or source-resolution strategy for real workspace consumers.
- [x] Replace demo-local helper where useful after package build output or adapter exists.

Acceptance:

- [x] Demo app can replace local API helper with package client.
- [x] SDK contract covers signup, signin, refresh, signout, `me`, and OAuth callback code exchange.
- [x] Real workspace/browser consumers can import the package without custom TypeScript source handling.

### Phase 11: Tests and Documentation

Status: In Progress

- [x] Add backend unit smoke tests.
- [x] Add backend e2e tests.
- [x] Add backend e2e test for all-sessions signout.
- [x] Add backend e2e test for OAuth callback code one-time exchange.
- [x] Add backend e2e test for concurrent OAuth callback code exchange.
- [x] Add backend e2e test for signin abuse throttling.
- [x] Add frontend tests if useful.
- [x] Add root README setup.
- [x] Add API README setup.
- [x] Add web README setup.
- [x] Add `.env.example` files.
- [x] Add seed documentation.
- [x] Add client onboarding documentation.
- [x] Add auth endpoint rate limiting.
- [x] Add signin abuse throttling.
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

### Phase 12: OIDC Provider Expansion

Status: Deferred

- [ ] Add authorization server module.
- [ ] Add `/oauth/authorize`.
- [ ] Add `/oauth/token`.
- [ ] Add `/oauth/userinfo`.
- [ ] Add `/oauth/introspect`.
- [ ] Add `/.well-known/jwks.json`.
- [ ] Add `/.well-known/openid-configuration`.
- [ ] Add Authorization Code with PKCE.
- [ ] Add `id_token`.
- [ ] Add key rotation.

Acceptance:

- [ ] VAuth acts as an OIDC provider, not only a central login API.
- [ ] External apps can integrate using standard OAuth/OIDC flows.

## 5. Decisions Log

Use this table for decisions made during implementation.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-07-28 | VAuth is a reusable authentication platform, not single-app auth. | Goal is "created once, used many." | Backend becomes the product; frontend becomes demo client. |
| 2026-07-28 | Use modular monolith architecture. | Keeps deployment simple while preserving module boundaries. | NestJS modules must stay capability-focused. |
| 2026-07-28 | Remove blog-domain schema. | Auth platform should not contain posts/comments/categories. | Prisma schema must be reset to auth-first models. |
| 2026-07-28 | Replace fixed role enum with database-backed roles. | Each app must define its own roles. | Authorization becomes app-scoped and dynamic. |
| 2026-07-28 | Use permission-first authorization internally. | Permissions scale better than checking role names everywhere. | Roles should bundle permissions; guards prefer permissions. |
| 2026-07-28 | Treat Next.js app as reference client only. | Backend should be reusable by many projects. | Next.js must not read DB or own auth business logic. |
| 2026-07-28 | Defer reusable SDK until demo flow is stable. | Avoid abstracting before API contract is proven. | `packages/auth-client` remains Phase 10. |
| 2026-07-28 | Defer full OIDC provider features. | Core custom auth API should work first. | OIDC is tracked as Phase 12. |
| 2026-07-28 | Split architecture and build plan into separate docs. | Architecture and implementation sequencing serve different jobs. | `architecture.md` owns system design; `build_plan.md` owns execution details. |
| 2026-07-28 | Add separate UI system and frontend integration docs. | Visual consistency and frontend auth usage have different concerns. | `ui_system.md` owns demo UI rules; `frontend_integration.md` owns client consumption patterns. |
| 2026-07-28 | Add first-read agent guide. | Future sessions need one stable entrypoint before reading all docs. | `agent_start_here.md` defines doc usage, workflow, package-doc rules, and permanent rules. |
| 2026-07-28 | Reviewed and applied reset migration to the configured Neon development database. | Inspection showed only scaffold tables with zero rows, so dropping them was safe. | Database now matches the auth-first Prisma schema. |
| 2026-07-28 | Use `@prisma/adapter-pg` in `PrismaService`. | Prisma 7 requires a driver adapter for direct PostgreSQL connections. | Backend tests and build now instantiate Prisma successfully. |
| 2026-07-28 | Use Next.js `proxy.ts` route protection instead of deprecated `middleware.ts`. | Next.js 16.2 warns that the middleware convention is moving to proxy. | Protected route UX works with the current convention. |
| 2026-07-28 | Keep `packages/auth-client` as a typed HTTP wrapper only. | Session storage and redirects remain client-app responsibilities. | Demo app stays stable while reusable contracts are introduced. |
| 2026-07-28 | Require verified Google email before OAuth account creation/linking. | Prevents unsafe linking based only on an unverified provider email string. | Google OAuth callback rejects profiles without a verified email signal. |
| 2026-07-28 | Use a CommonJS Prisma seed script. | Local `ts-node` dependency resolution failed on `yn`; plain Node avoids that toolchain dependency. | `npm run db:seed` now runs `node prisma/seed.cjs`. |
| 2026-07-28 | Enforce route `clientId` against token `clientId` in role and permission guards. | App-scoped routes must reject tokens issued for another app. | Cross-app access-control requests now return forbidden. |
| 2026-07-29 | Use one-time OAuth callback codes instead of redirecting VAuth tokens in query params. | Prevents access/refresh tokens from appearing in browser URLs, history, and logs. | Google callback redirects with `code`; frontend exchanges it server-side at `POST /auth/oauth/exchange`. |
| 2026-07-29 | Implement `allSessions` as user/app-wide refresh token revocation. | The API contract promised all active sessions for the current app, not just the current refresh-token family. | `POST /auth/signout` with `allSessions: true` revokes every active refresh token for that user/app after verifying the submitted token. |
| 2026-07-29 | Add layered public auth abuse protection. | Route-level rate limiting and repeated email/client signin failure throttling cover different abuse patterns. | `@nestjs/throttler` guards public auth routes; `SignInAttemptService` blocks repeated failures for a client/email pair. |
| 2026-07-29 | Superseded: keep the demo on local auth helpers while SDK exported TS source. | Next/Turbopack failed to consume the SDK source package while it used NodeNext `.js` source imports. | Superseded after adding SDK build output; demo now consumes `@repo/auth-client`. |
| 2026-07-29 | Review found OAuth callback code exchange needs atomic consumption. | Sequential reuse is tested, but concurrent exchanges can race before `consumedAt` is set. | Add compare-and-set style update or transaction before treating the code as consumed. |
| 2026-07-29 | Consume OAuth callback codes with compare-and-set. | Prevents concurrent exchange requests from both passing the same read/verify window. | `exchangeCallbackCode` now updates only when `consumedAt` is still null before issuing tokens; e2e covers concurrent reuse. |
| 2026-07-29 | Fail closed when Google OAuth config is missing or placeholder-like. | Empty and placeholder provider values create bad redirects and hide deployment mistakes. | Google OAuth config is centralized; strategy startup and route handling reject missing config instead of falling back. |
| 2026-07-29 | Document throttling/signin abuse tracking as single-instance/local for now. | Adding Redis/shared storage is a deployment architecture choice beyond this hardening pass. | Public auth abuse protection remains useful locally; production multi-instance/serverless deployments need shared storage before relying on it. |
| 2026-07-29 | Build `packages/auth-client` to `dist` and let the demo consume it. | Next/Turbopack could not consume the package while it exported TS source directly. | The SDK now exports JS/types from build output; web auth flows use `@repo/auth-client` while owning sessions locally. |
| 2026-07-29 | Build `@repo/auth-client` before web type checks. | The web app resolves SDK imports through ignored `dist` output, so clean app/root type checks must not depend on stale local build artifacts. | `turbo check-types` depends on upstream builds, and `apps/web` check-types builds the SDK before `next typegen` and `tsc`. |

## 6. Open Questions

Track unresolved product/engineering questions here.

- [ ] Should VAuth support automatic membership creation on signin for any registered client app, or should apps require explicit invites?
- [ ] Should the first version support platform admins, organizations, or only a seeded owner account?
- [ ] Should refresh tokens be sent in request body, Authorization header, or backend-managed cookies?
- [ ] Should demo app session expiry mirror refresh token expiry exactly or include idle timeout?
- [ ] Should user email verification be required before app membership becomes active?
- [ ] Should account linking by Google verified email be automatic or require explicit confirmation?
- [ ] Should initial OIDC design use asymmetric signing keys from the beginning?
- [ ] Should the demo Google redirect URI be derived from app/env configuration instead of hardcoded to the local callback URL?

## 7. Blockers

Current blockers:

- None for Phase 8 or Phase 11 local verification. User manually rotated exposed external credentials and verified Google OAuth end to end in a browser with approved Google Cloud credentials and callback URL.

Potential blockers:

- Remaining live `npm audit` findings do not currently have safe non-breaking fixes in npm's suggested path. Production audit is down to 3 high findings under Next's pinned `postcss`/`sharp`; full audit remains 29 high findings because dev-tooling chains through ESLint/Jest/Nest CLI still depend on vulnerable `minimatch`/`brace-expansion`/`glob` ranges.

## 8. Verification Log

Use this table to record commands run and outcomes.

| Date | Command/Check | Result | Notes |
|---|---|---|---|
| 2026-07-28 | Created planning docs | Passed | `agent_start_here.md`, `project_overview.md`, `architecture.md`, `build_plan.md`, `code_standards.md`, `library_docs.md`, `ui_system.md`, `frontend_integration.md`, and this tracker exist. |
| 2026-07-28 | `npm.cmd exec prisma validate` | Passed | Auth-first Prisma schema validates. |
| 2026-07-28 | `npm.cmd exec -- prisma generate` | Passed | Prisma Client generated successfully. |
| 2026-07-28 | `npm.cmd run build` in `apps/api` | Passed | NestJS backend compiles. |
| 2026-07-28 | `npm.cmd test` in `apps/api` | Passed | Existing unit smoke tests pass after Prisma adapter fix. |
| 2026-07-28 | `npm.cmd run build` in `apps/web` | Passed | Next.js demo client builds with placeholder env values. |
| 2026-07-28 | `npm.cmd run check-types` at repo root | Passed | Web, UI, and auth-client type checks pass. |
| 2026-07-28 | `npm.cmd run build` at repo root | Passed | API and web production builds pass with placeholder web env values. |
| 2026-07-28 | Read-only Neon DB inspection | Passed | Target DB had only `Category`, `Comment`, `Post`, `User`, and `_prisma_migrations`; scaffold table row counts were all `0`. |
| 2026-07-28 | `npm.cmd exec -- prisma migrate dev` | Passed | Applied `20260728171600_auth_platform_schema`; DB is in sync with schema. |
| 2026-07-28 | `npm.cmd run db:seed` | Passed | Seeded `vauth_demo_web` client, roles, permissions, and role-permission mappings. |
| 2026-07-28 | `npm.cmd run test:e2e` in `apps/api` | Passed | 9 tests passed: signup, duplicate signup, signin, protected route rejection, permission allow/deny, role allow/deny, wrong-app token rejection, refresh rotation/reuse rejection, signout revocation. |
| 2026-07-28 | `npm.cmd test` in `apps/api` | Passed | 2 unit smoke tests passed. |
| 2026-07-28 | `npm.cmd run build` in `apps/api` | Passed | Backend compiles after guard/config/test changes. |
| 2026-07-28 | `npm.cmd run check-types` at repo root | Passed | Workspace type checks pass. |
| 2026-07-28 | `npm.cmd run build` at repo root | Passed | API and web production builds pass with placeholder web env values. |
| 2026-07-28 | Review pass over auth/security implementation | Needs Follow-up | Found production-readiness gaps around all-session signout semantics, OAuth token callback transport, and auth endpoint abuse throttling. |
| 2026-07-28 | `npm.cmd run check-types` at repo root | Passed | Review-time type check passed. |
| 2026-07-28 | Synced `context/build_plan.md` task progress | Passed | Phase checkboxes now reflect completed implementation, partial follow-ups, and deferred OIDC work. |
| 2026-07-29 | `npm.cmd install @nestjs/throttler --workspace apps/api` | Passed | Added approved Nest throttling dependency. `npm audit` reports existing high-severity findings; not addressed in this session. |
| 2026-07-29 | `npm.cmd exec -- prisma generate` in `apps/api` | Passed | Generated Prisma Client after adding `OAuthCallbackCode`. |
| 2026-07-29 | `npm.cmd exec -- prisma migrate dev` in `apps/api` | Passed | Applied `20260729093000_oauth_callback_codes`; direct command timed out, follow-up `prisma migrate status` reported database schema up to date. |
| 2026-07-29 | `npm.cmd test` in `packages/auth-client` | Passed | 3 SDK tests passed for signin request shaping, OAuth code exchange request shaping, and `VAuthError` status handling. |
| 2026-07-29 | `npm.cmd run check-types` in `packages/auth-client` | Passed | SDK type check passed. |
| 2026-07-29 | `npm.cmd test` in `apps/api` | Passed | 2 unit smoke tests passed. |
| 2026-07-29 | `npm.cmd run build` in `apps/api` | Passed | Backend compiles after OAuth/throttling changes. |
| 2026-07-29 | `npm.cmd run test:e2e` in `apps/api` | Passed | 12 tests passed, including all-session signout, OAuth callback code one-time exchange, and signin abuse throttling. Required database escalation because sandboxed DB writes returned `EACCES`. |
| 2026-07-29 | `npm.cmd exec -- prisma validate` in `apps/api` | Passed | Prisma schema validates. |
| 2026-07-29 | Earlier `npm.cmd run build` at repo root | Superseded | API and web production builds passed, but Turbo build-output tracking was incomplete. Later build-output tracking fixed this warning. |
| 2026-07-29 | `npm.cmd run check-types` at repo root | Passed | Workspace type checks pass. A prior parallel run raced with Next build over `.next/types`; standalone rerun passed. |
| 2026-07-29 | Earlier Google OAuth env presence check | Superseded | Earlier session recorded missing Google OAuth values; current reconciliation check shows local API env entries are now populated, but browser/provider verification remains pending. |
| 2026-07-29 | Earlier review pass over hardening work | Superseded | Static review found OAuth callback atomicity, Google config fail-closed behavior, in-memory throttling documentation, and SDK packaging gaps. These implementation gaps were addressed later on 2026-07-29. |
| 2026-07-29 | Codebase reconciliation review against `progress_tracker.md` and `build_plan.md` | Needs Follow-up | Static audit confirmed Phases 0-7 and 9 are implemented; Phase 8, Phase 10, Phase 11 hardening items remain. Found stale tracker checkboxes and stale Google-env blocker wording. |
| 2026-07-29 | Current local env presence check | Needs Follow-up | Checked presence without printing values during reconciliation. Treat live Google browser verification as pending until credentials and callback registration are confirmed outside the repo. |
| 2026-07-29 | `npm.cmd test` in `packages/auth-client` | Passed | 3 SDK tests passed. |
| 2026-07-29 | `npm.cmd test` in `apps/api` | Passed | 2 API unit smoke tests passed. |
| 2026-07-29 | `npm.cmd exec -- prisma validate` in `apps/api` | Passed | Prisma schema validates. |
| 2026-07-29 | `npm.cmd run check-types` at repo root | Passed | Workspace type checks pass. |
| 2026-07-29 | Earlier `npm.cmd run build` at repo root | Superseded | API and web production builds passed, but Turbo output tracking was still incomplete. Later root build passed without the output warning. |
| 2026-07-29 | Earlier `npm.cmd run test:e2e` in `apps/api` | Superseded | Sandboxed DB-write attempt failed, first escalated run timed out, longer escalated run passed 12 tests. Later local SSL-mode cleanup removed the Prisma/pg warning. |
| 2026-07-29 | `npm.cmd install` at repo root | Passed | Updated workspace lockfile after adding `@repo/auth-client` to the web app. npm warned about pending install scripts; no dependency download was needed. |
| 2026-07-29 | Env example secret scan | Passed | `apps/api/.env.example` no longer contains the previous credential-looking Neon/Google values; placeholders remain. |
| 2026-07-29 | Local API `.env` SSL-mode update | Passed | Updated only the local database URL query flag to strict verification mode without printing the URL. |
| 2026-07-29 | `npm.cmd run build` in `packages/auth-client` | Passed | SDK emits JavaScript and declaration files to `dist`. |
| 2026-07-29 | `npm.cmd test` in `packages/auth-client` | Passed | 3 SDK tests passed. |
| 2026-07-29 | `npm.cmd run check-types` in `packages/auth-client` | Passed | SDK type check passed. |
| 2026-07-29 | `npm.cmd test` in `apps/api` | Passed | 5 API unit tests passed, including Google OAuth config fail-closed coverage. |
| 2026-07-29 | `npm.cmd run build` in `apps/api` | Passed | API compiles after OAuth atomicity/config changes. |
| 2026-07-29 | `npm.cmd exec -- prisma validate` in `apps/api` | Passed | Prisma schema validates. |
| 2026-07-29 | First hardening `npm.cmd run test:e2e` in `apps/api` | Failed, Fixed | 12/13 tests passed; OAuth transaction hit Prisma's default 5s interactive transaction timeout against the remote DB. Increased the OAuth transaction timeout to 15s. |
| 2026-07-29 | Final `npm.cmd run test:e2e` in `apps/api` | Passed | 13 backend e2e tests passed, including concurrent OAuth callback code reuse rejection. No Prisma/pg SSL-mode warning appeared. |
| 2026-07-29 | `npm.cmd run check-types` at repo root | Passed | Workspace type checks pass with the web app importing `@repo/auth-client`. |
| 2026-07-29 | `npm.cmd run build` at repo root | Passed | API, web, and auth-client builds pass; Turbo output warning is resolved by tracking `dist/**`. |
| 2026-07-29 | `npm.cmd audit --audit-level=high` | Blocked | Sandbox run could not reach the advisory endpoint; escalated run was rejected because audit sends dependency metadata to npm. Needs explicit approval before retrying. |
| 2026-07-29 | `npm.cmd run check-types` in `apps/web` | Passed | Web typecheck builds `@repo/auth-client` first, then runs `next typegen` and `tsc --noEmit`. |
| 2026-07-29 | `npm.cmd run check-types` at repo root | Passed | Root Turbo typecheck schedules `@repo/auth-client:build` before web type resolution. |
| 2026-07-29 | `npm.cmd run build` at repo root | Passed | API, auth-client, and web production builds pass after post-review fixes. |
| 2026-07-29 | `npm.cmd test` in `apps/web` | Passed | 9 frontend server-side tests passed for encrypted session behavior, fail-closed short session secret handling, protected route redirects, signed-in auth-page redirects, and admin route allow/deny decisions. |
| 2026-07-29 | Local credential hygiene scan and scrub | Needs External Follow-up | Removed local Google credential-looking values and local API secret values from `apps/api/.env`; workspace scan no longer finds Google client-secret/client-id patterns. External provider-side rotation is still required for any values already exposed outside local files. |
| 2026-07-29 | `npm.cmd audit --audit-level=high --json` | Blocked | Sandboxed live audit could not reach npm advisory endpoint; escalated audit was rejected because it sends dependency metadata to npm and needs explicit approval for that exact sharing. |
| 2026-07-29 | `npm.cmd audit --offline --audit-level=high --json` | Passed, Limited | Offline audit returned 0 cached vulnerabilities across 1035 dependencies. This does not replace live advisory triage. |
| 2026-07-29 | `npm.cmd run check-types` in `apps/web` | Passed | Web typecheck passed after adding frontend tests and route-policy extraction. |
| 2026-07-29 | `npm.cmd run check-types` at repo root | Passed | Root Turbo typecheck passed after frontend test additions. |
| 2026-07-29 | `npm.cmd run build` at repo root | Passed | API, auth-client, and web production builds pass after frontend tests and env scrub. |
| 2026-07-29 | `npm.cmd test` in `apps/api` | Passed | 5 API unit tests passed after local API env was scrubbed to placeholders. |
| 2026-07-29 | Local JWT/OAuth state secret regeneration | Passed | Regenerated `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `OAUTH_STATE_SECRET` in local `apps/api/.env` without printing values; length/pattern checks confirm they are set and non-placeholder. |
| 2026-07-29 | Local credential pattern checks | Passed, Limited | Workspace scan found no Google client-secret/client-id patterns and git history search found no matching Google/database URL patterns. Database and Google env fields remain placeholders until newly rotated provider values are supplied. |
| 2026-07-29 | `npm.cmd audit --offline --audit-level=high --json` | Superseded | Offline audit returned 0 cached vulnerabilities across 1035 dependencies. Later live audit ran after explicit approval and found real advisory data. |
| 2026-07-29 | `npm.cmd audit --audit-level=high --json` | Needs Follow-up | Live audit initially reported 29 high findings. The production-relevant Next cluster had a safe patch available for Next-specific advisories; dev-tooling findings require breaking/unsafe npm suggestions. |
| 2026-07-29 | `npm.cmd install next@16.2.12 --workspace web` | Passed | Updated the web app from Next 16.2.0 to 16.2.12, applying the safe non-major Next patch. |
| 2026-07-29 | `npm.cmd audit fix` | Needs Follow-up | Non-forced audit fix could not clear remaining advisories. npm suggests forced breaking/incorrect changes such as downgrading Next to 9.3.3 or major dev-tool changes. |
| 2026-07-29 | `npm.cmd audit --audit-level=high --omit=dev --json` | Needs Follow-up | Production-only audit reports 3 high findings under Next's pinned `postcss@8.4.31` and `sharp@0.34.5`. Attempted overrides for patched PostCSS/Sharp produced an invalid npm tree, so they were backed out. |
| 2026-07-29 | `npm.cmd ls postcss sharp next --all` | Passed | Dependency tree is valid again: `next@16.2.12` with its pinned `postcss@8.4.31` and `sharp@0.34.5`. |
| 2026-07-29 | `npm.cmd test` in `apps/web` | Passed | 9 frontend server-side tests passed after the Next patch. |
| 2026-07-29 | `npm.cmd run check-types` at repo root | Passed | Root typecheck passed after the Next patch. |
| 2026-07-29 | `npm.cmd run build` at repo root | Passed | API, auth-client, and web production builds pass on Next 16.2.12. |
| 2026-07-29 | Manual external credential rotation | Passed | User confirmed exposed real credentials from prior env examples/notes/chat/log contexts were rotated manually in external systems. No credential values were recorded. |
| 2026-07-29 | Manual live Google OAuth browser verification | Passed | User confirmed Google OAuth works end to end in a browser with approved Google Cloud credentials and callback URL. No credential values were recorded. |

## 9. Review Notes

- Resolved: `POST /auth/signout` with `allSessions` now revokes all active refresh tokens for the user/app after verifying the submitted refresh token.
- Resolved: Google OAuth now redirects with a one-time callback code and exchanges it server-side; VAuth tokens are no longer sent in callback query params.
- Resolved: Public auth endpoints now have `@nestjs/throttler` route limits and repeated signin failure throttling.
- Resolved: OAuth callback codes are now consumed with compare-and-set before token issuance; concurrent reuse is covered by backend e2e.
- Resolved: Google OAuth config now fails closed for missing or placeholder-like values instead of redirecting with empty/provider placeholder settings.
- Resolved: Credential-looking values were removed from `apps/api/.env.example`; rotate any real values that were previously exposed outside the local env file.
- Resolved: Local JWT and OAuth state secrets in `apps/api/.env` were replaced with generated non-placeholder values.
- Resolved: Auth throttling and signin abuse tracking are documented as process-local/single-instance only until shared storage is added.
- Resolved: `packages/auth-client` now builds to `dist`, exports JS/types from build output, and is consumed by the demo auth flows.
- Resolved: Clean type-checks no longer depend on pre-existing ignored SDK `dist` files; web/root type checks build the SDK first.
- Resolved: Sign-in runtime/network errors now show an authentication-service availability message instead of the generic invalid-credentials message.
- Resolved: Frontend route/session tests now cover encrypted session behavior and proxy route-policy decisions.
- Superseded: Offline `npm audit` reported no cached vulnerabilities, but live audit later ran after dependency-metadata sharing was explicitly approved.
- Triaged: Live `npm audit` ran with approval. Applied safe Next patch to 16.2.12; remaining high advisories require upstream Next dependency updates or breaking/unsafe forced changes.
- Important: The demo Google sign-in button currently hardcodes the local callback URL, which is fine for the reference local app but not ready for multi-environment deployment.
- Complete: Live Google OAuth verification is confirmed by the user with approved Google Cloud credentials and callback URL.

## 10. Extra Notes

- The backend should be built first. The frontend should prove consumption, not drive backend architecture.
- Roles are app-local names. Never use role names as global platform concepts unless explicitly modeling platform roles separately.
- Permissions should use `resource:action`.
- OIDC is the path toward a true mini-Auth0/Keycloak experience, but it is not required for the first reusable VAuth API.
- The demo client should pass `clientId` with auth requests.
- Never store access or refresh tokens in browser-readable storage.
- Update this tracker whenever a phase status changes.

## 11. Next Immediate Actions

Recommended next coding session:

1. Read `context/agent_start_here.md` and follow the reading order.
2. Decide whether production deployment needs shared throttler/signin-attempt storage before launch, or keep the documented single-instance limitation for the current milestone.
3. Track upstream safe fixes for Next's pinned `postcss`/`sharp` advisories and dev-tooling `minimatch`/`brace-expansion` chains; avoid `npm audit fix --force` unless intentionally accepting breaking toolchain changes.
4. Keep OIDC provider expansion deferred until the current VAuth API is intentionally moved toward standards-compatible provider mode.
