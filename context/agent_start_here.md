# Agent Start Here: VAuth

Read this file first in every VAuth session.

This document gives the complete project map, required reading order, build workflow, documentation rules, package-documentation rules, and non-negotiable project rules.

## 1. What You Are Building

VAuth is a reusable authentication platform.

It is built once and reused across many apps. The backend is the product. The frontend is a demo/reference client that proves another app can consume the backend safely.

Core shape:

```txt
apps/api
  -> VAuth backend
  -> identity, auth, client apps, roles, permissions, tokens, OAuth, audit logs

apps/web
  -> demo client
  -> signup/signin UI, encrypted session cookie, protected pages, VAuth API consumption

packages/*
  -> shared UI/tooling now
  -> reusable auth SDK/types later
```

The system must support:

- Multiple registered client apps.
- App-scoped users/memberships.
- Dynamic roles per app.
- Dynamic permissions per app.
- Password signup/signin.
- Google OAuth login.
- App-scoped JWT access tokens.
- Rotating hashed refresh tokens.
- Backend-enforced authorization.
- Secure frontend session handling.

## 2. Required Reading Order

Read these documents in this order before coding:

1. `context/agent_start_here.md`
2. `context/project_overview.md`
3. `context/architecture.md`
4. `context/build_plan.md`
5. `context/code_standards.md`
6. `context/library_docs.md`
7. `context/progress_tracker.md`

For frontend UI work, also read:

8. `context/ui_system.md`

For frontend auth/session work, also read:

9. `context/frontend_integration.md`

Do not start implementation until you understand the current phase in `context/progress_tracker.md`.

## 3. What Each File Is For

| File                              | Purpose                                                   | When to Use                          |
| --------------------------------- | --------------------------------------------------------- | ------------------------------------ |
| `context/agent_start_here.md`     | First-read guide and permanent project rules              | Every session                        |
| `context/project_overview.md`     | Product definition, problem, users, features, UI, scope   | Before product or UX decisions       |
| `context/architecture.md`         | System architecture, domain model, token model, API model | Before backend/schema/auth decisions |
| `context/build_plan.md`           | Implementation phases, tasks, acceptance checks           | While choosing what to build next    |
| `context/code_standards.md`       | Coding conventions and implementation rules               | Before editing code                  |
| `context/library_docs.md`         | VAuth-specific rules for third-party libraries            | Before adding or using dependencies  |
| `context/ui_system.md`            | Demo client UI rules, tokens, components, pages           | Before frontend UI work              |
| `context/frontend_integration.md` | How frontend apps consume VAuth                           | Before frontend auth/session work    |
| `context/client_onboarding.md`    | Concrete integration guide for consuming apps             | When onboarding another app          |
| `context/progress_tracker.md`     | Current status, decisions, blockers, verification         | At start and end of every session    |
| `context/abougAuth.md`            | Background IAM/AuthN/AuthZ concepts                       | When validating auth architecture    |
| `context/aboutVideo.md`           | Tutorial summary/background reference                     | When comparing against tutorial flow |
| `context/notes.md`                | Early raw notes                                           | Historical reference only            |

## 4. How to Start a Session

Start every implementation session like this:

1. Read `context/agent_start_here.md`.
2. Read the required docs listed above.
3. Open `context/progress_tracker.md`.
4. Identify the current phase and incomplete checklist items.
5. Inspect the existing code before editing.
6. Confirm there are no user changes you might overwrite.
7. Implement only the next scoped piece unless a dependency requires an earlier fix.
8. Run relevant verification commands when feasible.
9. Update `context/progress_tracker.md` before finishing.

Never skip the tracker. It is the project memory across sessions.

## 5. How to Choose What to Build Next

Use this priority order:

1. User's newest explicit request.
2. Current blocker in `context/progress_tracker.md`.
3. Current in-progress phase.
4. Next incomplete task in `context/build_plan.md`.
5. Required cleanup that blocks the current phase.

Do not jump ahead to frontend polish before backend auth contracts are stable.

Default build order:

```txt
1. Auth-first Prisma schema.
2. Backend foundation.
3. Client app management.
4. Signup.
5. Signin and tokens.
6. Refresh and revocation.
7. Guards and app-scoped authorization.
8. Google OAuth.
9. Demo Next.js client.
10. Reusable auth client package.
11. Tests and docs.
12. OIDC expansion later.
```

## 6. Package Documentation Rules

When using third-party packages, do not rely only on memory.

Required process:

1. Check the package version in the relevant `package.json`.
2. Read `context/library_docs.md` for VAuth-specific usage rules.
3. Inspect existing local code usage.
4. If package behavior is version-sensitive, uncertain, recently changed, or security-sensitive, fetch latest official docs for the installed major version before coding.
5. Prefer official documentation, framework docs, package READMEs, and primary sources.
6. Do not use random blog snippets for auth, Prisma, NestJS, Next.js, OAuth, JWT, cookies, or cryptography behavior.

Version-sensitive packages include:

- Next.js.
- React.
- NestJS.
- Prisma.
- Passport strategies.
- JWT libraries.
- `jose`.
- `argon2`.
- `class-validator`.
- `zod`.

Use current docs especially for:

- Next.js App Router, Middleware, Route Handlers, and Server Actions.
- React 19 form APIs.
- NestJS 11 guards, providers, modules, and validation.
- Prisma 7 schema, migrations, adapter usage, and generated client behavior.
- OAuth strategy setup.
- Cookie encryption and JWT/JWK behavior.

Rules:

- Implement against the installed version, not an imagined older version.
- If docs and installed version conflict, pause and verify before coding.
- Do not upgrade dependencies casually to match an example.
- Do not introduce a new library because an example uses it.
- Update `context/library_docs.md` when adding a new dependency or changing how a dependency is used.

## 7. Documentation Update Rules

Update documentation when you change:

- Data model.
- API route contracts.
- Auth flow.
- Token payload.
- Session strategy.
- Role/permission behavior.
- Environment variables.
- Package usage.
- UI components, routes, tokens, or navigation.
- Build phase status.
- Major decisions or tradeoffs.

Where to update:

- Product/scope change: `context/project_overview.md`
- System design change: `context/architecture.md`
- Build sequencing/task change: `context/build_plan.md`
- Coding convention change: `context/code_standards.md`
- Dependency usage change: `context/library_docs.md`
- Demo UI change: `context/ui_system.md`
- Frontend auth/session change: `context/frontend_integration.md`
- Client onboarding change: `context/client_onboarding.md`
- Completed work/decision/blocker: `context/progress_tracker.md`

## 8. Rules That Never Change

These rules are permanent unless the user explicitly changes the project direction.

### Product Rules

- VAuth is a reusable auth platform, not single-app auth.
- The backend is the core product.
- The frontend is a reference client.
- Future apps consume VAuth through API/SDK contracts.

### Architecture Rules

- Use a modular monolith.
- Keep module boundaries clear.
- Do not add unrelated app-domain models.
- Do not reintroduce `Post`, `Comment`, or `Category`.
- Do not make application roles a fixed enum.
- Roles and permissions are app-scoped database records.

### Security Rules

- Never store plaintext passwords.
- Never store raw refresh tokens.
- Never expose token hashes.
- Never expose client secret hashes.
- Never store tokens in browser-readable storage.
- Never trust frontend roles or permissions.
- Backend authorization is authoritative.
- Tokens issued for one app must not authorize another app.
- Validate `clientId`, `redirectUri`, and origin where applicable.
- Rotate secrets if they are pasted into docs, chat, commits, screenshots, or logs.

### Frontend Rules

- Do not read or write the database from `apps/web`.
- Do not implement backend auth business logic in Next.js.
- Use encrypted HTTP-only cookies for demo client sessions.
- Keep tokens out of Client Components.
- Middleware is for UX routing, not final security.
- Follow `context/ui_system.md` for demo UI consistency.

### Dependency Rules

- Do not hand-roll cryptography.
- Do not add NextAuth/Auth.js unless the architecture intentionally changes.
- Do not add another ORM.
- Do not add a second backend validation library casually.
- Do not add dependencies for trivial helpers.
- Do not upgrade packages without need and verification.

## 9. Current Documentation Set

The canonical docs are:

```txt
context/agent_start_here.md
context/project_overview.md
context/architecture.md
context/build_plan.md
context/code_standards.md
context/library_docs.md
context/ui_system.md
context/frontend_integration.md
context/client_onboarding.md
context/progress_tracker.md
```

If these files disagree, resolve in this order:

1. User's newest explicit instruction.
2. `context/agent_start_here.md` for permanent process/rules.
3. `context/project_overview.md` for product scope.
4. `context/architecture.md` for system design.
5. `context/code_standards.md` for implementation conventions.
6. `context/library_docs.md` for dependency usage.
7. `context/build_plan.md` for build sequence.
8. `context/progress_tracker.md` for current status.

When you resolve a conflict, update the stale document.

## 10. Completion Routine

Before ending a session:

1. Summarize what changed.
2. Run relevant checks when feasible.
3. Update `context/progress_tracker.md`.
4. Record new decisions in the decision log.
5. Record blockers or open questions.
6. Mention any verification not run.
7. Keep final response concise and specific.
