# Code Standards: VAuth

These rules apply to every implementation session in this project.

The purpose of this file is to prevent pattern drift. Any AI agent or developer working on VAuth must follow these conventions unless the user explicitly updates this document.

## 1. Engineering Mindset

VAuth is a reusable authentication platform, not a one-off auth feature inside a single app.

Always optimize for:

- Correct security boundaries.
- Clear module ownership.
- App-scoped authorization.
- Maintainable modular monolith structure.
- Explicit contracts between backend and frontend.
- Simple, boring, testable code.

Do not optimize for:

- Demo shortcuts that leak into core architecture.
- Hard-coded roles.
- Frontend-owned authorization.
- Copy-pasted auth logic across apps.
- Hidden magic or clever abstractions.

When in doubt:

1. Keep the backend as source of truth.
2. Keep auth state server-controlled.
3. Keep roles and permissions app-scoped.
4. Keep modules isolated by responsibility.
5. Add tests around security-sensitive behavior.

## 2. Project Architecture Rules

The monorepo has this ownership model:

```txt
apps/api   -> real authentication platform backend
apps/web   -> demo/reference client app only
packages/* -> shared tooling, UI, and later reusable auth SDK/types
context/*  -> project planning and standards
```

Rules:

- `apps/api` owns users, credentials, client apps, sessions, tokens, OAuth, roles, permissions, memberships, and audit logs.
- `apps/web` must consume the API like any external app would.
- `apps/web` must not bypass the API by reading the database directly.
- Shared code belongs in `packages/*` only when at least two apps/packages need it.
- Do not add app-domain models such as posts, comments, products, invoices, or todos to the auth backend.
- Do not reintroduce fixed role enums for application roles.

## 3. Modular Monolith Rules

Use a modular monolith in NestJS.

Each module must own one business capability:

```txt
config/
prisma/
identity/
auth/
clients/
access-control/
oauth/
audit/
health/
```

Module responsibilities:

- `config`: environment loading and validation.
- `prisma`: Prisma service and database lifecycle.
- `identity`: users, credentials, external identities.
- `auth`: signup, signin, refresh, signout, token issuance, guards, decorators.
- `clients`: registered applications that consume VAuth.
- `access-control`: roles, permissions, memberships, authorization checks.
- `oauth`: Google OAuth now, OIDC provider features later.
- `audit`: security and administrative event logs.
- `health`: public liveness/readiness endpoints.

Rules:

- Controllers must be thin.
- Services contain business logic.
- Database access stays in services, not controllers.
- Guards make access decisions, not business services.
- DTOs define external input contracts.
- Do not let modules reach across boundaries casually. Import another module through its exported service.

## 4. TypeScript Rules

Use strict TypeScript everywhere.

Rules:

- Do not use `any` unless there is no reasonable alternative.
- If `any` is unavoidable, isolate it and explain why with a short comment.
- Prefer `unknown` over `any` for untrusted values.
- Prefer explicit return types on exported functions, public methods, guards, and helpers.
- Use `type` for object shapes and unions.
- Use `interface` when extending a framework contract or declaration merging.
- Prefer discriminated unions for state machines and result objects.
- Do not use non-null assertions unless the value is guaranteed by a nearby guard.
- Do not silence TypeScript with `as` unless the boundary is well understood.
- Avoid barrel files unless the package already uses them consistently.
- Keep imports ordered: framework, external libraries, internal absolute/shared imports, relative imports.

Naming:

- Variables and functions: `camelCase`.
- Types, classes, DTOs, React components: `PascalCase`.
- Constants: `SCREAMING_SNAKE_CASE` only for true constants.
- Files and folders: `kebab-case`.
- Test files: `*.spec.ts` for Nest unit tests, `*.e2e-spec.ts` for e2e tests.

## 5. Backend Stack Rules

Backend stack:

- NestJS 11.
- Prisma 7.
- PostgreSQL through Neon.
- Argon2id for password and refresh token hashing.
- JWT access tokens plus rotating refresh tokens.
- Dynamic app-scoped roles and permissions.

Required backend patterns:

- Use dependency injection.
- Use DTOs with validation decorators for request bodies.
- Use global validation pipe.
- Register global validation before `app.listen(...)`.
- Use Nest exceptions, not raw thrown strings.
- Use guards for authentication and authorization.
- Use decorators for route metadata.
- Use Prisma service for database access.

Do not:

- Put password/token logic in controllers.
- Return Prisma user records directly from auth endpoints.
- Return password hashes, refresh token hashes, client secret hashes, or internal metadata.
- Use fixed role enums for app roles.
- Trust frontend-provided roles or permissions.

## 6. NestJS 11 Conventions

File naming:

```txt
*.module.ts
*.controller.ts
*.service.ts
*.guard.ts
*.strategy.ts
*.decorator.ts
*.dto.ts
*.type.ts
*.spec.ts
```

Controller rules:

- Controllers define routes and delegate to services.
- Controllers should not call Prisma directly.
- Controllers should not hash passwords or sign tokens.
- Controllers should not contain authorization logic beyond decorators.

Service rules:

- Services own business logic.
- Services should be small enough to test.
- Prefer one service per clear responsibility.
- Use transactions for multi-write flows such as signup, membership creation, role assignment, and audit logging.

Guard rules:

- `JwtAuthGuard` authenticates the user.
- Permission/role guards authorize app-scoped access.
- Guards must fail closed.
- If route metadata is missing, default behavior must be secure.

Decorator rules:

Use these patterns:

```ts
@Public()
@CurrentUser()
@CurrentClient()
@RequirePermissions("members:manage")
@RequireRoles("owner")
```

Do not invent alternate names unless this file is updated.

Global app setup:

- Enable validation globally.
- Enable CORS intentionally.
- Enable security middleware such as `helmet`.
- Configure cookies only when needed.
- Keep port and origins in env.

## 7. Prisma 7 Conventions

Prisma schema rules:

- Keep schema auth-first.
- Use `String @id @default(cuid())` for new auth platform IDs unless there is a strong reason not to.
- Use `createdAt DateTime @default(now())`.
- Use `updatedAt DateTime @updatedAt` on mutable records.
- Use explicit unique constraints for business invariants.
- Use join tables for many-to-many relationships when metadata or future growth is likely.
- Use cascading deletes only when child records have no meaning without the parent.
- Never store plaintext secrets.

Required core models:

- `User`
- `Credential`
- `ExternalAccount`
- `ClientApp`
- `AppMembership`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `RefreshToken`
- `AuditLog`

Role rules:

- `Role` must be a model, not an enum.
- Role names are unique per app: `@@unique([appId, name])`.
- Permissions are unique per app: `@@unique([appId, action])`.
- Membership is unique per user/app: `@@unique([userId, appId])`.

Migration rules:

- Do not hand-edit generated migration SQL unless required and reviewed.
- Every schema change must have a migration.
- Run Prisma generate after schema changes.
- Seed local demo data through a seed script, not ad hoc manual database edits.

Query rules:

- Select only fields required by the response.
- Prefer `select` for auth endpoints to avoid leaking sensitive fields.
- Use transactions for multi-step writes.
- Do not expose raw Prisma errors to clients.

## 8. Authentication Rules

Password auth:

- Hash passwords with Argon2id.
- Never store plaintext or reversible encrypted passwords.
- Reject duplicate email cleanly.
- Return sanitized user objects only.

Refresh tokens:

- Store refresh tokens only as Argon2id hashes.
- Refresh tokens must be app-scoped.
- Refresh tokens must rotate on each refresh.
- Refresh token reuse should revoke the token family.
- Signout must revoke the current refresh token or token family.

Access tokens:

- Access tokens must be short lived.
- Access tokens must include app scope.
- Access tokens must include only claims needed for authorization and identity.
- Tokens issued for one app must not authorize another app.

Access token payload shape:

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

Do not include:

- Password hashes.
- Refresh token hashes.
- Client secret hashes.
- Large profile objects.
- Untrusted frontend-provided claims.

## 9. Authorization Rules

Authorization is app-scoped.

Rules:

- Backend authorization is authoritative.
- Frontend authorization is only for user experience.
- Prefer permission checks over role checks.
- Roles are bundles of permissions.
- A route for one app must not accept roles or permissions from another app.
- Guards must compare route app context with token app context.
- App management routes must be restricted to platform/admin ownership rules.

Permission naming:

Use `resource:action`.

Examples:

```txt
profile:read
profile:update
members:manage
roles:manage
admin:read
```

Avoid vague permissions:

```txt
admin
full_access
can_edit
allowed
```

## 10. OAuth and SSO Rules

Current OAuth provider:

- Google OAuth 2.0 as external login provider.

Rules:

- Validate `clientId`.
- Validate `redirectUri` against registered client app redirect URIs.
- Store external identities in `ExternalAccount`.
- Link accounts carefully by verified email only.
- Include `clientId` and `redirectUri` in signed/validated OAuth state.
- Issue VAuth app-scoped tokens after provider login.
- Redirect frontend callbacks with a one-time code, not VAuth tokens in query params.
- Exchange OAuth callback codes server-side before writing frontend session cookies.

Future OIDC provider support:

- Add `/oauth/authorize`.
- Add `/oauth/token`.
- Add `/oauth/userinfo`.
- Add `/oauth/introspect`.
- Add `/.well-known/jwks.json`.
- Add `/.well-known/openid-configuration`.
- Add Authorization Code with PKCE.
- Add `id_token` only when implementing OIDC properly.

Do not pretend Google OAuth login is the same as VAuth being an OIDC provider.

## 11. Next.js 16 Conventions

Frontend stack:

- Next.js 16 App Router.
- React 19.
- Server Components by default.
- Server Actions for form submissions.
- Route Handlers for server-side session operations.

Rules:

- Keep pages server-first.
- Add `"use client"` only when interactivity or browser APIs are required.
- Do not put tokens in client components.
- Do not store tokens in `localStorage` or `sessionStorage`.
- Use HTTP-only encrypted cookies for app sessions.
- Middleware may read encrypted session data for routing decisions.
- Route protection in middleware must mirror backend permissions, but backend remains authoritative.

Prefer:

- `useActionState` with React 19 if available.
- `useFormStatus` for submit button pending state.
- Server Actions for signup/signin forms.
- Route Handlers for callback/session update/signout endpoints.

Avoid:

- Client-side auth as source of truth.
- Fetching protected API data directly from browser components unless the endpoint is designed for it.
- Duplicating backend authorization logic in the frontend.

## 12. Next.js File Structure

Recommended frontend layout:

```txt
apps/web/app/
  (auth)/
    signin/
      page.tsx
    signup/
      page.tsx
  (protected)/
    dashboard/
      page.tsx
    profile/
      page.tsx
  admin/
    page.tsx
  auth/
    callback/
      route.ts
  api/
    auth/
      session/
        route.ts
      signout/
        route.ts
  layout.tsx
  middleware.ts

apps/web/components/
  auth/
  layout/
  ui/

apps/web/lib/
  auth/
    actions.ts
    auth-fetch.ts
    session.ts
    schemas.ts
    types.ts
  api.ts
```

Rules:

- Route folders use `kebab-case`.
- Components use `PascalCase`.
- Component files use `PascalCase.tsx` only if the repo standard moves that way; otherwise prefer `kebab-case.tsx`.
- Keep route-level code close to routes.
- Keep reusable auth/session helpers in `lib/auth`.

## 13. React Component Structure

Component rules:

- Server Components by default.
- Client Components must be small and focused.
- Forms can be split into a client form component plus server action.
- Do not pass tokens to Client Components.
- Do not fetch secret/authenticated server data in Client Components if Server Components can do it.

Component order:

```tsx
type Props = {
  // ...
};

export function ComponentName(props: Props) {
  // ...
}
```

Rules:

- Define props types near the component.
- Avoid deeply nested component files.
- Keep styling consistent with existing CSS/module or design system choices.
- Shared presentational components belong in `packages/ui` only when reusable.

## 14. API Route Handlers

This section applies to Next.js Route Handlers in `apps/web/app/**/route.ts`.

Rules:

- Route Handlers may manage frontend cookies.
- Route Handlers may call the NestJS backend.
- Route Handlers must not implement identity business logic.
- Route Handlers must not read or write the database.
- Route Handlers must validate all incoming query params and body data.
- Route Handlers must return consistent JSON or redirects.
- Route Handlers must never expose tokens to client JavaScript.

Use Route Handlers for:

- OAuth callback from backend.
- Session update after refresh.
- Signout cookie cleanup.

Do not use Route Handlers as a second backend.

## 15. Server Actions

Rules:

- Use Server Actions for sign up and sign in forms.
- Validate form data with Zod before calling the API.
- Return typed form state for validation/API errors.
- Create or update session cookies only in server contexts.
- Redirect after successful authentication.
- Never return raw tokens to Client Components.

Form state shape:

```ts
type ActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};
```

Rules:

- Keep action files in `lib/auth/actions.ts` or route-local `actions.ts`.
- Do not mix UI rendering and business logic in the same file.
- Do not duplicate validation schemas across files.

## 16. Error Handling

Backend error rules:

- Use Nest exceptions:
  - `BadRequestException`
  - `UnauthorizedException`
  - `ForbiddenException`
  - `ConflictException`
  - `NotFoundException`
  - `InternalServerErrorException`
- Do not leak implementation details.
- Do not leak whether sensitive records exist when that creates enumeration risk.
- Log internal details server-side only.
- Return stable, client-safe messages.

Frontend error rules:

- Convert backend errors into user-safe form messages.
- Do not display raw stack traces.
- Do not display raw Prisma/Nest error names to users.
- Keep auth failure messages generic where appropriate.

Recommended API error shape:

```ts
type ApiError = {
  statusCode: number;
  message: string | string[];
  error?: string;
  code?: string;
};
```

Security-sensitive messages:

- Signin failure: `Invalid email or password`.
- Refresh failure: clear session and require signin.
- Permission failure: `You do not have access to this resource`.

## 17. Environment Variables

Rules:

- No hard-coded secrets.
- No committed real `.env` files.
- Provide `.env.example` with placeholder values.
- Validate required environment variables at startup.
- Use different secrets for access tokens, refresh tokens, sessions, and OAuth.
- Public frontend env values must use `NEXT_PUBLIC_`.
- Private frontend env values must never use `NEXT_PUBLIC_`.

Backend env:

```env
DATABASE_URL=""
API_PORT=8000
WEB_APP_URL="http://localhost:3000"

JWT_ACCESS_SECRET=""
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET=""
JWT_REFRESH_EXPIRES_IN="7d"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:8000/auth/google/callback"
```

Frontend env:

```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_CLIENT_ID="vauth_demo_web"
SESSION_SECRET=""
```

Secrets:

- Rotate any secret pasted into notes, chat, commits, or screenshots.
- Never print secrets in logs.
- Never include secrets in frontend bundles.

## 18. Dependency Rules

General:

- Prefer established libraries for security-sensitive behavior.
- Do not hand-roll cryptography.
- Do not add a dependency for trivial helpers.
- Keep dependencies scoped to the app/package that needs them.
- Use the repo package manager and workspace structure.

Backend approved dependency purposes:

- `@nestjs/config` for config.
- `@nestjs/passport`, `passport`, strategies for auth flows.
- `@nestjs/jwt` or `jose` for JWT signing/verification.
- `argon2` for password and refresh token hashing.
- `helmet` for HTTP security headers.
- `@nestjs/throttler` for rate limiting.
- `class-validator` and `class-transformer` for Nest DTO validation.

Frontend approved dependency purposes:

- `jose` for encrypted session cookies.
- `zod` for form validation.
- Icon/component libraries only when consistent with the UI direction.

Rules:

- Do not introduce NextAuth/Auth.js unless the architecture is intentionally changed.
- Do not introduce an ORM besides Prisma.
- Do not add state management libraries for auth unless a clear frontend need appears.

## 19. Security Rules

Non-negotiable:

- HTTPS in production.
- HTTP-only cookies for frontend sessions.
- `secure` cookies in production.
- `SameSite=Lax` by default.
- CSRF protection for cookie-authenticated state-changing requests.
- Rate limiting on auth endpoints.
- Account lockout or abuse throttling for repeated signin failures.
- Audit logs for security events.
- No plaintext secrets.
- No browser-readable tokens.
- No frontend-trusted roles.

Security events to audit:

- Signup.
- Signin success.
- Signin failure.
- Refresh success.
- Refresh reuse detected.
- Signout.
- OAuth login.
- Role created/updated/deleted.
- Permission created/updated/deleted.
- Membership role changed.
- Client app created/updated/disabled.

## 20. Testing Rules

Test security-sensitive behavior.

Backend unit tests:

- Token generation.
- Password verification.
- Refresh rotation.
- Role/permission guard logic.
- Client app validation.

Backend e2e tests:

- Signup.
- Duplicate signup.
- Signin success.
- Signin failure.
- Protected route without token.
- Protected route with wrong app token.
- Refresh success.
- Refresh reuse failure.
- Signout revocation.
- Dynamic role allow/deny.
- Permission allow/deny.

Frontend tests, when introduced:

- Form validation.
- Session cookie creation/deletion through server actions or route handlers.
- Middleware redirects.
- `authFetch` refresh retry.

Rules:

- Add tests when changing auth, token, guard, role, permission, or session behavior.
- Do not skip tests around authorization edge cases.

## 21. API Contract Rules

Every endpoint must have:

- Clear DTO/request shape.
- Clear response shape.
- Defined auth requirement.
- Defined app-scope behavior.
- Stable error behavior.

Response rules:

- Return sanitized user data.
- Return token pairs only from auth endpoints.
- Do not return internal hashes.
- Do not expose raw database records.

Auth route naming:

Use:

```txt
POST /auth/signup
POST /auth/signin
POST /auth/refresh
POST /auth/signout
GET  /auth/me
```

Do not mix these with alternate names like `/login`, `/register`, or `/logout` unless the API is intentionally versioned or aliased.

## 22. File and Folder Naming

General:

- Folders: `kebab-case`.
- Backend classes: `PascalCase`.
- DTO classes: `PascalCase` ending in `Dto`.
- Guards: `PascalCase` ending in `Guard`.
- Strategies: `PascalCase` ending in `Strategy`.
- Decorators: `kebab-case.decorator.ts`.
- Types: `kebab-case.type.ts`.

Examples:

```txt
sign-in.dto.ts
sign-up.dto.ts
jwt-auth.guard.ts
require-permissions.decorator.ts
access-token-payload.type.ts
client-app.service.ts
```

Avoid:

- Mixed casing in filenames.
- Abbreviations that are not common.
- Large `utils.ts` catch-all files.
- Generic folders like `common` unless the contents are truly shared.

## 23. Logging Rules

Rules:

- Log security events through `AuditService`.
- Do not log passwords, tokens, token hashes, client secrets, or OAuth codes.
- Do not log full request bodies on auth endpoints.
- Logs should include request correlation IDs later if added.
- Use structured metadata for audit logs.

## 24. Documentation Rules

Keep docs updated when architecture changes.

Update docs when:

- API contracts change.
- Prisma schema changes.
- Env variables change.
- Auth/session behavior changes.
- Client app onboarding changes.
- Build or seed steps change.

Required docs:

- `context/agent_start_here.md`: first-read guide, workflow, package-doc rules, and permanent project rules.
- `context/project_overview.md`: product definition, scope, users, flows, UI, and success criteria.
- `context/architecture.md`: system design and architectural decisions.
- `context/build_plan.md`: implementation phases, tasks, and acceptance checks.
- `context/code_standards.md`: implementation rules.
- `context/library_docs.md`: project-specific third-party library usage.
- `context/ui_system.md`: demo client UI rules, tokens, components, routes, and page states.
- `context/frontend_integration.md`: frontend usage patterns for consuming VAuth.
- `context/client_onboarding.md`: concrete onboarding steps for consuming apps.
- `context/progress_tracker.md`: implementation status, decisions, blockers, and verification history.
- Root/API/web README files: setup and run instructions once implementation starts.
- `.env.example`: safe placeholders only.

## 25. Implementation Checklist for Every Session

Before coding:

1. Read `context/agent_start_here.md`.
2. Read `context/project_overview.md`.
3. Read `context/architecture.md`.
4. Read `context/build_plan.md`.
5. Read `context/code_standards.md`.
6. Read `context/library_docs.md`.
7. Read `context/ui_system.md` before frontend UI work.
8. Read `context/frontend_integration.md` before frontend auth/session work.
9. Inspect existing files before editing.
10. Follow current module boundaries.

During coding:

1. Keep changes scoped.
2. Use existing patterns.
3. Do not reintroduce forbidden architecture.
4. Add or update tests for auth-sensitive changes.
5. Do not commit secrets.

Before finishing:

1. Run the relevant formatter/typecheck/test commands when feasible.
2. Report what changed.
3. Report what was not verified.
4. Mention any security or migration follow-up.
