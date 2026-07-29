# Prompts to Write: VAuth

Use this file as the prompt playbook for building VAuth in order.

Current next prompt: **Phase 1 - Reset Domain to Authenticator**

Rules for using this file:

1. Start each new implementation session with the restore/context prompt.
2. Use the prompt under the current phase in `context/progress_tracker.md`.
3. After a phase or meaningful fix, run review.
4. After UI work, run imprint.
5. Before ending a session, update the tracker and save memory/context.
6. Do not jump ahead unless the tracker says the earlier phase is complete or blocked.

---

# Setup

## Prompt - first read before every session

```txt
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Confirm once you've read all context files, identified the current phase in [progress_tracker.md](context/progress_tracker.md), and are ready to build.
```

## Prompt - restore session memory

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Then check [progress_tracker.md](context/progress_tracker.md) and tell me the next implementation prompt I should use.
```

## Prompt - package docs before dependency-sensitive work

```txt
Check package versions in the relevant package.json, read [library_docs.md](context/library_docs.md), then fetch or verify the latest official docs for any version-sensitive package needed for this phase.
Do not upgrade dependencies unless the phase requires it.
```

---

# Phase 1 - Reset Domain to Authenticator

Use this next.

## Prompt

```txt
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Then implement Phase 1 from [build_plan.md](context/build_plan.md): replace the scaffold/blog-shaped Prisma schema with the auth-first VAuth domain.

Remove Post, Comment, Category, blog relations, and the fixed Role enum.
Add User, Credential, ExternalAccount, ClientApp, AppMembership, database-backed Role, Permission, UserRole, RolePermission, RefreshToken, AuditLog, and required enums.

Create the migration if feasible, run Prisma generate, and update [progress_tracker.md](context/progress_tracker.md) with completed tasks, decisions, blockers, and verification.
```

## Prompt - if migration conflicts

```txt
/recover
Phase 1 Prisma schema reset has migration or database conflicts.
Read [build_plan.md](context/build_plan.md), [architecture.md](context/architecture.md), and [progress_tracker.md](context/progress_tracker.md), diagnose whether this is schema design, migration history, database state, or environment setup, then fix the safest path without deleting user data unless I explicitly approve it.
```

## Prompt - review Phase 1

```txt
/review
Review the Phase 1 Prisma auth domain implementation against [architecture.md](context/architecture.md), [build_plan.md](context/build_plan.md), and [code_standards.md](context/code_standards.md).
Focus on app-scoped roles/permissions, token storage safety, uniqueness constraints, and removal of blog-domain models.
```

---

# Phase 2 - Backend Foundation

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Implement Phase 2 from [build_plan.md](context/build_plan.md): backend foundation.

Fix bootstrap ordering, add ConfigModule and env validation, add PrismaModule, add HealthModule with public GET /health, configure CORS intentionally, add helmet, and create/update backend .env.example.

Run relevant checks and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - review Phase 2

```txt
/review
Review backend foundation for NestJS 11 conventions, secure bootstrap setup, env validation, PrismaModule ownership, CORS, helmet, and public /health behavior.
Fix issues found and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Phase 3 - Client App Management

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Implement Phase 3 from [build_plan.md](context/build_plan.md): client app management.

Create ClientsModule, controller, service, create/update DTOs, create/list/get/update endpoints, disable/delete policy, allowed origin validation, redirect URI validation, client secret hashing if used, and seed data for vauth_demo_web with default roles and permissions.

Run relevant verification and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - review Phase 3

```txt
/review
Review client app management for app isolation, validation, clientId uniqueness, redirect URI/origin safety, secret hashing, and seed correctness.
Fix issues found and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Phase 4 - Identity and Signup

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Implement Phase 4 from [build_plan.md](context/build_plan.md): identity and password signup.

Create IdentityModule, user lookup/creation, credential creation, Argon2id password hashing, clientId validation, app membership creation, default role assignment, transaction-safe signup writes, signup audit log, and POST /auth/signup.

Return only sanitized data. Run relevant checks and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - review Phase 4

```txt
/review
Review signup for duplicate email handling, password hash safety, transaction boundaries, app membership creation, default role assignment, and audit logging.
Fix issues found and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Phase 5 - Signin and Token Issuance

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Implement Phase 5 from [build_plan.md](context/build_plan.md): signin and token issuance.

Add signin DTO, TokenService, credential validation, app membership lookup, app-scoped roles and permissions loading, access token signing, refresh token signing, refresh token family ID, refresh token hashing/storage, signin audit log, and POST /auth/signin.

Ensure invalid signin returns a safe generic error. Run relevant checks and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - review Phase 5

```txt
/review
Review signin and token issuance for app-scoped token claims, role/permission isolation, refresh-token hash storage, generic errors, and sensitive field leakage.
Fix issues found and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Phase 6 - Refresh, Rotation, and Revocation

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Implement Phase 6 from [build_plan.md](context/build_plan.md): refresh token rotation and signout revocation.

Add refresh DTO, refresh token verification, app-scope verification, stored hash verification, rotation on success, previous-token revocation, token family reuse detection, family revocation on reuse, current-session signout, optional all-sessions signout if appropriate, and refresh/signout audit logs.

Run relevant checks and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - review Phase 6

```txt
/review
Review refresh and revocation for token reuse detection, token family handling, app-boundary enforcement, hash verification, audit logs, and signout behavior.
Fix issues found and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Phase 7 - Global Guards and App-Scoped Authorization

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Implement Phase 7 from [build_plan.md](context/build_plan.md): protected APIs and app-scoped authorization.

Add @Public(), @CurrentUser(), @CurrentClient(), @RequirePermissions(...), @RequireRoles(...), JWT strategy, global JWT guard, permission guard, optional role guard, and protect client/role/permission/membership routes.

Ensure public auth and health routes still work. Run relevant checks and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - review Phase 7

```txt
/review
Review authorization for protected-by-default behavior, public route bypass, app-scoped permission checks, database-driven roles, and cross-app token rejection.
Fix issues found and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Phase 8 - Google OAuth

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Check [library_docs.md](context/library_docs.md) and official docs for the installed Google OAuth/Passport packages.
Implement Phase 8 from [build_plan.md](context/build_plan.md): Google OAuth.

Add Google strategy, OAuth start and callback routes, signed or protected OAuth state, clientId and redirectUri in state, redirect URI validation, ExternalAccount linking, membership/default role creation when allowed, app-scoped VAuth token issuance, callback redirect, and OAuth audit log.

Run relevant checks and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - review Phase 8

```txt
/review
Review Google OAuth for state validation, redirect URI enforcement, external account linking safety, app-scoped token issuance, and separation between Google tokens and VAuth tokens.
Fix issues found and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Phase 9 - Demo Next.js Client

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Also read [ui_system.md](context/ui_system.md) and [frontend_integration.md](context/frontend_integration.md).
Implement Phase 9 from [build_plan.md](context/build_plan.md): demo Next.js client.

Add frontend env values, UI foundation, encrypted HTTP-only session helpers, signup/signin forms, form schemas, server actions, clientId forwarding, OAuth callback route handler, authFetch with silent refresh retry, dashboard/profile/admin pages, middleware route protection, and frontend permission checks for UX.

Run the frontend locally if feasible, verify the main flows, and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - UI imprint

```txt
/imprint
Read [ui_system.md](context/ui_system.md) and record any new reusable UI patterns introduced during Phase 9.
Keep the UI registry consistent and update [progress_tracker.md](context/progress_tracker.md) if UI scope changed.
```

## Prompt - review Phase 9

```txt
/review
Review the demo Next.js client for secure session handling, no browser-readable tokens, server-action boundaries, authFetch refresh behavior, protected routes, middleware UX, and UI consistency.
Fix issues found and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Phase 10 - Reusable Auth Client Package

Use only after Phase 9 is stable.

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Implement Phase 10 from [build_plan.md](context/build_plan.md): reusable auth client package.

Create packages/auth-client with typed client factory, signup/signin/refresh/signout/me helpers, package README, tests where useful, and replace demo-local helpers only where it improves reuse without destabilizing the demo.

Run relevant checks and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - review Phase 10

```txt
/review
Review packages/auth-client for typed contracts, reusable integration ergonomics, no leaked backend internals, and no behavior drift from the demo client.
Fix issues found and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Phase 11 - Tests and Documentation

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Implement Phase 11 from [build_plan.md](context/build_plan.md): tests and documentation.

Add backend unit/e2e tests for signup, duplicate signup, signin, protected routes, wrong-app token rejection, refresh rotation, refresh reuse failure, signout revocation, role allow/deny, and permission allow/deny.

Add or update root/API/web README files, .env.example files, seed docs, and client onboarding docs.
Run the full relevant verification suite and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - review Phase 11

```txt
/review
Review tests and documentation for coverage of app-scoped isolation, token isolation, refresh rotation, setup clarity, env completeness, and client onboarding accuracy.
Fix issues found and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Phase 12 - OIDC Provider Expansion

Use only after the core VAuth API is stable.

## Prompt

```txt
/remember restore
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Use architect first for Phase 12 before implementation.

[$architect](C:\Users\VISHNU CHANDAK\.codex\skills\.system\5DevelopmentSkills\architect\SKILL.md) Phase 12 OIDC provider expansion from [build_plan.md](context/build_plan.md).
```

## Prompt - implement after architecture is approved

```txt
Implement the approved Phase 12 OIDC provider plan.
Add authorization code storage, PKCE support, /oauth/authorize, /oauth/token, /oauth/userinfo, /oauth/introspect, /.well-known/jwks.json, /.well-known/openid-configuration, asymmetric signing keys, key rotation, id_token support, and e2e tests.

Run relevant checks and update [progress_tracker.md](context/progress_tracker.md).
```

---

# Recovery Prompts

## Prompt - general bug recovery

```txt
/recover
Something is not working in the current VAuth phase.
Read [agent_start_here.md](context/agent_start_here.md), [build_plan.md](context/build_plan.md), [architecture.md](context/architecture.md), [code_standards.md](context/code_standards.md), [library_docs.md](context/library_docs.md), and [progress_tracker.md](context/progress_tracker.md).

Diagnose the failure type first, then fix the smallest correct cause. Run relevant verification and update [progress_tracker.md](context/progress_tracker.md).
```

## Prompt - security-sensitive bug

```txt
/recover
This is a security-sensitive auth bug.
Check [architecture.md](context/architecture.md), [code_standards.md](context/code_standards.md), [library_docs.md](context/library_docs.md), and official docs for the involved packages.

Fix the issue without weakening token safety, password hashing, app isolation, role/permission checks, cookie security, or OAuth validation.
Add or update tests if the behavior is auth-critical.
```

## Prompt - UI bug

```txt
/recover
There is a UI bug in the demo client.
Read [ui_system.md](context/ui_system.md) and [frontend_integration.md](context/frontend_integration.md), run the local app if feasible, inspect the issue in the browser, fix it, and verify desktop/mobile layouts.
Then run /imprint if reusable UI patterns changed.
```

---

# Completion Prompts

## Prompt - update tracker

```txt
Update [progress_tracker.md](context/progress_tracker.md) for the completed work.
Mark completed checklist items, update current status/current focus, add decisions, blockers, verification results, and next immediate actions.
Do not overwrite useful existing history.
```

## Prompt - remember save

```txt
/remember save, append the data, don't overwrite.
Include what changed, what was verified, current phase status, next prompt to use, decisions made, blockers, and files that matter next session.
```

## Prompt - final session cleanup

```txt
Run /review for the current phase, fix high-priority issues, update [progress_tracker.md](context/progress_tracker.md), then /remember save append the data, don't overwrite.
Tell me the exact next prompt I should use.
```

---

# Quick Next Prompt

Copy this when continuing from the current tracker state:

```txt
Read [agent_start_here.md](context/agent_start_here.md) and follow the reading order specified.
Then implement Phase 1 from [build_plan.md](context/build_plan.md): replace the scaffold/blog-shaped Prisma schema with the auth-first VAuth domain.

Remove Post, Comment, Category, blog relations, and the fixed Role enum.
Add User, Credential, ExternalAccount, ClientApp, AppMembership, database-backed Role, Permission, UserRole, RolePermission, RefreshToken, AuditLog, and required enums.

Create the migration if feasible, run Prisma generate, and update [progress_tracker.md](context/progress_tracker.md) with completed tasks, decisions, blockers, and verification.
```
