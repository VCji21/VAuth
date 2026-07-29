# Memory - VAuth Core Build

Last updated: 2026-07-28 23:59 IST

## What was built

- Applied the Phase 1 reset migration to the reviewed Neon development database after confirming scaffold tables had zero rows.
- Seeded the VAuth demo client, roles, permissions, and role-permission mappings with `npm run db:seed`.
- Replaced `apps/api/prisma/seed.ts` with `apps/api/prisma/seed.cjs` and updated Prisma config to run the seed through plain Node.
- Added backend e2e tests covering signup, duplicate signup, signin, protected route rejection, permission allow/deny, role allow/deny, wrong-app token rejection, refresh rotation/reuse rejection, and signout revocation.
- Fixed app-scope enforcement in permission and role guards so `:clientId` routes reject tokens issued for another app.
- Fixed `API_PORT` env validation by explicitly transforming it to a number.
- Replaced `apps/api/prisma/schema.prisma` with the auth-first VAuth domain: `User`, `Credential`, `ExternalAccount`, `ClientApp`, `AppMembership`, database-backed `Role`/`Permission`, `UserRole`, `RolePermission`, `RefreshToken`, `AuditLog`, and required enums.
- Added local reset migration artifact at `apps/api/prisma/migrations/20260728171600_auth_platform_schema/migration.sql`.
- Added backend foundation: env validation, config module usage, Prisma module, Prisma 7 `@prisma/adapter-pg`, health route, CORS, helmet, `.env.example`.
- Added backend auth/client/access-control/OAuth/audit modules and services for client app management, signup, signin, refresh rotation/reuse detection, signout, global JWT/permission/role guards, Google OAuth state/callback linking, and seed data.
- Google OAuth linking now requires a verified Google email signal before creating/linking an account.
- Added `apps/api/prisma/seed.ts` for `vauth_demo_web`, roles, permissions, and mappings.
- Replaced the web starter with a VAuth demo client: signin/signup forms, encrypted HTTP-only session helpers, OAuth callback route, signout route, `authFetch`, protected dashboard/profile/admin pages, and Next.js `proxy.ts` route protection.
- Added `packages/auth-client` typed HTTP helper package.
- Added `ui-registry.md` via imprint and updated root/API/web READMEs plus `context/progress_tracker.md`.

## Decisions made

- It was safe to apply the reset migration because Neon DB inspection showed only scaffold tables with zero rows.
- Prisma seed runs as CommonJS via Node to avoid local `ts-node` dependency-resolution failure.
- App-scoped route guards compare route `clientId` against token `clientId`.
- Used Prisma 7 driver adapter setup in `PrismaService` with `@prisma/adapter-pg`.
- Used Next.js `proxy.ts` instead of deprecated `middleware.ts`.
- Google OAuth account creation/linking requires verified provider email.
- Kept `packages/auth-client` as a transport/API wrapper; frontend session storage remains app-owned.

## Problems solved

- `npm run db:seed` initially failed because `ts-node` could not resolve `yn`; changing the seed to CommonJS fixed it.
- E2E bootstrap initially failed on dynamic import in Jest; changed to typed `require`.
- E2E env validation exposed `API_PORT` string-to-number handling; fixed with `@Type(() => Number)`.
- E2E tests initially timed out due Argon2 plus remote DB latency; raised Jest timeout to 60 seconds.
- PowerShell `npx.ps1` execution policy was avoided by using `npm.cmd exec`.
- Incomplete dependencies were fixed with workspace `npm install`.
- Prisma Client initialization failure was fixed by adding the PostgreSQL driver adapter.
- Next build SWC lockfile patching was settled by rerunning build/install with network approval.
- Lucide icon export error was fixed by replacing the unavailable `Chrome` icon.

## Current state

- Neon development database is migrated to the auth-first schema and seeded.
- `npm.cmd run test:e2e` passed in `apps/api` with 9 auth/security tests.
- `npm.cmd exec prisma validate` passed in `apps/api`.
- `npm.cmd exec -- prisma generate` passed in `apps/api`.
- `npm.cmd run build` passed in `apps/api`.
- `npm.cmd test` passed in `apps/api`.
- `npm.cmd run check-types` passed at repo root.
- `npm.cmd run build` passed at repo root with placeholder web env values.
- Remaining Phase 11 work is optional frontend tests and richer client onboarding docs.
- Prisma/pg emits an SSL-mode warning for the current Neon URL; consider updating the connection string to explicit `sslmode=verify-full`.

## Next session starts with

Start API and web locally and verify signup/signin/refresh through the browser. Then add client onboarding docs for integrating a second app and consider frontend tests for proxy/session route behavior.

## Open questions

- Is the configured Neon database disposable for this reset migration?
- Should refresh tokens continue to be submitted in the request body, or move to backend-managed cookies for browser clients?
- Should Google account linking by verified email remain automatic for the first version?

---

# Memory - VAuth Review Pass

Last updated: 2026-07-28

## What was built

- Completed a review pass over the auth/security implementation after Phase 11 e2e work.
- Updated `context/progress_tracker.md` with review findings, a review-time type-check result, and revised next immediate actions.

## Decisions made

- Did not change implementation during review mode; captured findings as follow-up work instead.
- Kept Phase 11 as In Progress because frontend tests and onboarding documentation are still optional but incomplete.

## Problems solved

- Confirmed `npm.cmd run check-types` still passes at the repo root after the review pass.
- Clarified tracker state so production-readiness risks are visible even though backend build/e2e checks are green.

## Current state

- Backend e2e coverage from the previous pass remains documented as passing: signup, duplicate signup, signin, protected route rejection, permission allow/deny, role allow/deny, wrong-app token rejection, refresh rotation/reuse rejection, and signout revocation.
- Review found three important follow-ups:
  - `POST /auth/signout` accepts `allSessions`, but implementation only revokes active refresh tokens in the current family, not all sessions for the user/app.
  - Google OAuth callback currently redirects VAuth access and refresh tokens in query parameters; production should use a one-time callback code exchange.
  - Public auth endpoints do not yet have explicit rate limiting or signin abuse throttling.
- Review also noted tracker hygiene: Phase 2-10 checklist items remain unchecked despite roadmap rows showing Complete.
- `context/build_plan.md` has now been updated so completed, partial, and deferred checklist items match the current project state.

## Next session starts with

Fix `allSessions` signout semantics or remove/rename the option, then replace OAuth token-in-query callback transport with one-time code exchange, then add auth endpoint rate limiting.

## Open questions

- Should `allSessions` revoke all active refresh tokens for the user/app, or should the public API expose only current-session signout for now?
- Should browser clients move refresh-token handling fully into backend-managed cookies instead of request-body refresh tokens?

---

# Memory - VAuth Hardening Pass

Last updated: 2026-07-29

## What was built

- Implemented real `allSessions` signout semantics in `apps/api/src/auth/auth.service.ts`: after verifying the submitted refresh token, `allSessions: true` revokes every active refresh token for that user/app.
- Added `@nestjs/throttler` to `apps/api`, registered `ThrottlerModule` and global `ThrottlerGuard`, and added route-level throttles to public auth/OAuth endpoints.
- Added `SignInAttemptService` to block repeated signin failures by client/email pair.
- Added `OAuthCallbackCode` Prisma model and migration `20260729093000_oauth_callback_codes`.
- Replaced Google OAuth token-in-query redirects with one-time callback code flow:
  - Google callback redirects to frontend with `?code=...`.
  - Frontend route handler exchanges code via `POST /auth/oauth/exchange`.
  - Backend issues VAuth tokens only from the server-side exchange.
- Added SDK support for `exchangeOAuthCode`, `VAuthError`, and Node built-in package tests.
- Added `context/client_onboarding.md` and updated README/API/frontend/architecture/standards docs for code exchange and onboarding.
- Synced `context/build_plan.md` and `context/progress_tracker.md`.

## Decisions made

- Demo web app does not consume `packages/auth-client` yet. Next/Turbopack failed to resolve the SDK source package while it uses NodeNext `.js` source imports. Keep demo-local helpers until the package has build output or a Next adapter.
- Frontend route/session tests were not added this pass because the web app has no test runner yet; package tests and backend e2e cover the changed contracts.

## Problems solved

- Prisma migration/status initially failed in the sandbox with schema-engine/EACCES behavior; escalated migration/status confirmed the DB is up to date.
- Backend build initially failed because Nest 11 does not export `TooManyRequestsException`; fixed with `HttpException` and `HttpStatus.TOO_MANY_REQUESTS`.
- Prisma generated the callback-code delegate as `oAuthCallbackCode`; updated service calls accordingly.
- Root build initially failed when web consumed `@repo/auth-client` source directly; reverted demo SDK consumption and documented the packaging follow-up.

## Current state

- Applied migration `20260729093000_oauth_callback_codes`; Prisma status reported database schema up to date.
- `npm.cmd test` in `packages/auth-client` passed: 3 tests.
- `npm.cmd run check-types` in `packages/auth-client` passed.
- `npm.cmd test` in `apps/api` passed.
- `npm.cmd run build` in `apps/api` passed.
- `npm.cmd run test:e2e` in `apps/api` passed with 12 tests, including all-session signout, one-time OAuth code exchange/reuse rejection, and signin abuse throttling.
- `npm.cmd exec -- prisma validate` in `apps/api` passed.
- Root `npm.cmd run build` passed.
- Root `npm.cmd run check-types` passed after rerunning standalone; a prior parallel run raced with Next build over `.next/types`.
- `apps/api/.env` exists but Google OAuth client ID, secret, and callback URL are not populated, so live Google provider verification is still blocked.
- `npm install` reported existing high-severity audit findings; not triaged in this pass.

## Next session starts with

Add real Google OAuth env values, confirm the callback URL in Google Cloud, start API/web, and verify the browser Google login flow end to end.

## Open questions

- Should `packages/auth-client` grow a build step, or should a separate Next adapter consume its source safely?
- Should frontend route/session tests wait for a chosen web test runner, or should minimal Node-based tests be introduced?

---

# Memory - VAuth Post-Hardening Review

Last updated: 2026-07-29 00:53 IST

## What was built

- Completed a review pass over the hardening work for all-session signout, OAuth callback code exchange, rate limiting/signin abuse throttling, Google OAuth verification status, client onboarding docs, package tests, and frontend route/session test planning.
- Updated `context/progress_tracker.md` with production hardening follow-up findings and revised next immediate actions.
- Updated `context/build_plan.md` so Phase 8 and Phase 10 reflect the review status and remaining package/OAuth hardening tasks.

## Decisions made

- Stayed in review mode and did not change implementation code during this pass.
- Marked Phase 8 and Phase 10 as `Needs Review` because the implementation is locally verified but has production-readiness gaps.
- Kept live Google OAuth verification blocked until real Google client credentials and callback URL are configured.

## Problems solved

- Identified that OAuth callback code reuse protection is sequentially tested but not safe under concurrent exchange attempts.
- Identified that Google OAuth missing-env behavior currently degrades into bad provider redirects/placeholders rather than a controlled server-side error.
- Identified that throttling/signin abuse tracking is in-memory only and must either move to shared storage or be documented as single-instance only.
- Confirmed the demo still should not consume `packages/auth-client` until the package has build output or a Next-compatible consumption strategy.

## Current state

- No tests were rerun in this review pass; previous hardening verification remains documented as passing.
- `context/progress_tracker.md` and `context/build_plan.md` now list the key follow-ups:
  - Make OAuth callback code consumption atomic before token issuance.
  - Make Google OAuth fail closed with a clear server-side config error when env values are missing.
  - Add real Google OAuth credentials and verify browser OAuth end to end.
  - Decide shared throttler storage versus documented single-instance/local-only limits.
  - Add package build output or a Next adapter so the demo can consume `packages/auth-client`.
  - Consider frontend route/session tests after auth behavior stabilizes.

## Next session starts with

Fix OAuth callback code exchange atomicity in `apps/api/src/oauth/oauth.service.ts`, then add a controlled Google OAuth missing-configuration failure path.

## Open questions

- Should auth throttling use Redis/shared storage now, or is single-instance behavior acceptable for the current milestone?
- Should `packages/auth-client` publish built `dist` output, or should the monorepo use a dedicated Next adapter/source-resolution setup?

---

# Memory - VAuth Security & Architecture Polish

Last updated: 2026-07-29 15:46 IST

## What was built

- Fixed OAuth callback-code exchange atomicity in `apps/api/src/oauth/oauth.service.ts` by consuming codes with a compare-and-set style `updateMany` before issuing VAuth tokens.
- Increased the Google-login Prisma interactive transaction timeout to tolerate remote database latency observed in e2e verification.
- Added fail-closed Google OAuth config handling in `apps/api/src/oauth/google-oauth.config.ts` and wired it into the Google strategy/controller.
- Added tests for Google OAuth config validation and concurrent OAuth callback-code exchange behavior.
- Cleaned `apps/api/.env.example` so it contains placeholders instead of credential-looking values and documents `sslmode=verify-full`.
- Documented local/single-instance throttling and signin-attempt storage limits instead of silently implying multi-instance safety.
- Added package build output for `packages/auth-client` and updated exports to consume `dist`.
- Wired the demo web app to use `@repo/auth-client` for signin, signup, refresh, OAuth code exchange, and signout.
- Updated Turbo/web typecheck scripts so clean checkouts build `@repo/auth-client` before web type resolution.
- Reconciled `context/progress_tracker.md` and `context/build_plan.md` with the actual completed and remaining work.

## Decisions made

- OAuth callback codes must be consumed atomically before token issuance; sequential reuse tests alone are not sufficient.
- Google OAuth should fail closed on missing or placeholder config rather than falling back to empty strings or dummy provider values.
- Auth throttling/signin-attempt tracking remains process-local for now and is documented as a single-instance limitation.
- `packages/auth-client` now uses standard built `dist` output instead of exporting TypeScript source directly to Next.
- Demo web auth API calls should go through the SDK package now that package build output exists.

## Problems solved

- Fixed the race where concurrent OAuth callback-code exchanges could mint more than one token pair.
- Fixed missing Google OAuth config behavior so startup/request paths surface controlled server-side configuration errors.
- Fixed SDK consumption failures in the demo by adding package build output and making web typecheck build the package first.
- Fixed a clean-checkout typecheck risk where web could resolve `@repo/auth-client` before its declarations existed.
- Fixed signin error handling so runtime/service failures are not mislabeled as invalid credentials.
- Resolved an e2e timeout caused by remote database latency during the Google login transaction.

## Current state

- `packages/auth-client` build, tests, and typecheck pass.
- `apps/api` unit tests, build, Prisma validate, and e2e tests pass.
- Root `npm run check-types` and `npm run build` pass.
- `apps/web` standalone `npm run check-types` passes.
- No dev servers are currently running.
- Live Google OAuth browser verification is still blocked until real Google credentials and redirect configuration are provided outside the repo.
- Credential rotation remains an external operational task.
- `npm audit` has not been run because it requires explicit approval to send dependency metadata to the npm registry.

## Next session starts with

Provide real Google OAuth credentials and callback configuration, start API/web locally, and verify the Google OAuth browser flow end to end. After that, decide whether to add Redis/shared storage for throttling or keep the documented single-instance limitation for this milestone.

## Open questions

- Should production throttling/signin-abuse tracking move to Redis/shared storage now?
- Which frontend test runner should be introduced for route/session behavior, if frontend tests are still desired?
- Is it acceptable to run `npm audit` and send dependency metadata to the npm registry for vulnerability triage?

---

# Memory - VAuth Phase 8/11 Completion

Last updated: 2026-07-29 17:49 IST

## What was built

- Added frontend route/session tests in `apps/web/test/` using Node's built-in test runner.
- Extracted route protection decisions into `apps/web/lib/auth/route-policy.ts` and kept `apps/web/proxy.ts` as the Next adapter.
- Added `npm test` to the web workspace and documented it in `apps/web/README.md`.
- Replaced local placeholder-like `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `OAUTH_STATE_SECRET` in `apps/api/.env` with generated non-placeholder values without printing them.
- Ran live `npm audit` after explicit approval, patched the web app from Next 16.2.0 to 16.2.12, and updated the lockfile.
- Updated `context/progress_tracker.md` and `context/build_plan.md` to mark Phase 8 complete and record Phase 11 hardening state.

## Decisions made

- Keep frontend tests lightweight for now: pure route-policy tests plus session crypto tests give useful coverage without adding a browser test stack.
- Do not run `npm audit fix --force`; npm's remaining suggested fixes require breaking or unsafe dependency moves.
- Treat production shared storage for throttling/signin-attempt tracking as a deployment decision, not a blocker for the local milestone.

## Problems solved

- Frontend route/session behavior now has direct test coverage.
- Local JWT/OAuth state secrets are no longer placeholder-like.
- Live Google OAuth verification is no longer blocked: the user confirmed the browser flow works end to end with approved Google Cloud credentials and callback URL.
- External credential rotation is no longer blocked: the user confirmed exposed real credentials were rotated manually in external systems.
- Audit triage is no longer blocked on npm metadata approval: live audit was run and safely actionable fixes were applied.

## Current state

- Phase 8 Google OAuth is complete.
- Phase 11 tests/docs/hardening tasks are complete for the current milestone.
- Verification currently recorded as passing includes web tests, root typecheck, root build, API unit tests, SDK tests/build/typecheck, Prisma validation, and backend e2e from the hardening pass.
- Live `npm audit` still reports remaining high advisories, but they do not have safe non-breaking fixes in npm's suggested path:
  - production-only audit remains at 3 high findings under Next's pinned `postcss`/`sharp`;
  - full audit remains higher because dev tooling chains through ESLint/Jest/Nest CLI dependencies.
- No secret values should be copied from env files, chat, logs, or memory.

## Next session starts with

Decide whether production deployment needs Redis/shared storage for throttling and signin-attempt tracking. After that, monitor or revisit safe dependency updates for the remaining audit advisories, and keep OIDC provider work deferred unless the product direction intentionally moves there.

## Open questions

- Should production throttling/signin-attempt tracking move to Redis/shared storage now?
- Should remaining npm audit advisories wait for upstream safe releases, or is a breaking toolchain upgrade acceptable later?
- When should VAuth start Phase 12 OIDC provider expansion?
