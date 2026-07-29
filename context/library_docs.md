# Library Usage Guide: VAuth

This file documents how VAuth uses third-party libraries.

It is not general documentation. It only describes project-specific rules, patterns, and constraints for this codebase.

Any AI agent or developer must read this before adding, removing, or changing third-party library usage.

## 1. Library Policy

Rules:

- Use third-party libraries intentionally.
- Keep dependencies scoped to the app or package that needs them.
- Do not add a root dependency unless it is used by the whole monorepo.
- Do not hand-roll cryptography, token parsing, OAuth, password hashing, or validation primitives.
- Do not add a second library that solves the same problem unless the project intentionally migrates.
- Prefer framework-native NestJS and Next.js patterns before adding a helper dependency.
- Never add a dependency to avoid understanding the existing architecture.

Dependency locations:

```txt
mono_auth/package.json              -> monorepo tooling only
apps/api/package.json               -> NestJS backend libraries
apps/web/package.json               -> Next.js demo client libraries
packages/ui/package.json            -> reusable UI component dependencies only
packages/eslint-config/package.json -> lint config dependencies only
packages/typescript-config          -> tsconfig package only
```

## 2. Current Installed Libraries

These are already present in the project scaffolding.

## 3. `turbo`

Used in:

- Root monorepo scripts.

Purpose:

- Run tasks across workspace packages.
- Coordinate `dev`, `build`, `lint`, and `check-types`.

VAuth rules:

- Root scripts should call Turbo.
- App/package scripts should perform local work only.
- Do not bypass Turbo in documentation unless debugging a single package.
- Do not put auth logic or build assumptions inside `turbo.json`.

Allowed patterns:

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "check-types": "turbo run check-types"
  }
}
```

## 4. `typescript`

Used in:

- Entire monorepo.

Purpose:

- Static typing.
- Type checking apps and packages.

VAuth rules:

- Keep TypeScript strict.
- Exported backend methods should have explicit return types.
- Auth payloads, session payloads, DTO response shapes, and SDK contracts must be typed.
- Do not use `any` for request users, JWT payloads, sessions, Prisma result mapping, or API responses.
- Shared auth types may move to `packages/auth-types` once more than one workspace package needs them.

Project-specific important types:

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

## 5. `prettier`

Used in:

- Root formatting script.
- API formatting script.

Purpose:

- Consistent formatting.

VAuth rules:

- Use Prettier for formatting only.
- Do not debate formatting in feature code.
- Do not manually align code in ways Prettier will undo.
- Markdown, TypeScript, and TSX files should be safe to format.

Allowed root pattern:

```json
{
  "format": "prettier --write \"**/*.{ts,tsx,md}\""
}
```

## 6. `eslint` and `typescript-eslint`

Used in:

- Backend.
- Frontend.
- Shared packages.
- `packages/eslint-config`.

Purpose:

- Static linting.
- TypeScript-aware code quality.

VAuth rules:

- Treat lint warnings as actionable.
- Do not disable rules inline unless the exception is narrow and justified.
- Keep shared lint rules in `packages/eslint-config`.
- Do not create unrelated local ESLint styles in individual apps.
- Auth-sensitive code should be lint-clean before completion.

## 7. `eslint-config-prettier`

Used in:

- API and shared ESLint config.

Purpose:

- Disable ESLint rules that conflict with Prettier.

VAuth rules:

- Keep formatting responsibility in Prettier.
- Keep correctness/code-quality responsibility in ESLint.
- Do not add style-only ESLint rules that fight Prettier.

## 8. `@eslint/js`, `globals`, and `typescript-eslint`

Used in:

- ESLint config packages and app configs.

Purpose:

- Base JavaScript linting.
- Runtime global definitions.
- TypeScript lint integration.

VAuth rules:

- These belong in lint config, not application logic.
- Update shared config instead of duplicating config in each app.

## 9. `eslint-plugin-prettier`

Used in:

- API lint setup.

Purpose:

- Runs Prettier through ESLint in the Nest scaffold.

VAuth rules:

- Accept scaffold usage.
- Do not rely on it as the only formatter. Use `npm run format` when formatting broadly.
- If lint becomes noisy, prefer aligning shared config over scattering disables.

## 10. `eslint-plugin-only-warn`

Used in:

- Shared Turborepo ESLint config.

Purpose:

- Converts some lint failures to warnings in scaffold config.

VAuth rules:

- Do not treat auth/security warnings as optional.
- Production auth code should be corrected even if the linter only warns.

## 11. `eslint-plugin-react` and `eslint-plugin-react-hooks`

Used in:

- Frontend/shared React lint config.

Purpose:

- React component and Hooks rules.

VAuth rules:

- Hooks must only appear in Client Components.
- Keep Client Components small.
- Do not use Hooks to store tokens in browser state.
- Do not suppress Hooks dependency warnings unless the code is intentionally stable and explained.

## 12. `eslint-plugin-turbo`

Used in:

- Shared monorepo lint config.

Purpose:

- Validates Turborepo workspace/env usage.

VAuth rules:

- Respect env dependency warnings.
- Keep task/environment dependencies explicit.
- Do not hide required env variables from Turbo if build outputs depend on them.

## 13. `next`

Used in:

- `apps/web`.

Purpose:

- Demo/reference client app.
- App Router pages.
- Route Handlers.
- Middleware.
- Server Actions.

VAuth rules:

- The web app consumes `apps/api` like an external project.
- Do not put backend identity logic in Next.js.
- Do not read/write the auth database from Next.js.
- Use Server Components by default.
- Use Route Handlers only for frontend session/callback tasks.
- Use Middleware for page routing protection, not authoritative security.
- Never expose access tokens or refresh tokens to Client Components.

Allowed uses:

```txt
app/(auth)/signin/page.tsx
app/(auth)/signup/page.tsx
app/auth/callback/route.ts
app/api/auth/signout/route.ts
middleware.ts
```

Forbidden uses:

- Implementing `/auth/signin` business logic in Next.js.
- Calling Prisma from Next.js.
- Storing refresh tokens in browser-readable cookies.

## 14. `react` and `react-dom`

Used in:

- `apps/web`.
- `packages/ui`.

Purpose:

- UI rendering.
- Client interactivity where needed.

VAuth rules:

- Server Components are default in the app.
- Client Components require `"use client"`.
- Use React state for UI state only, never as the source of auth truth.
- Use React 19 form patterns such as `useActionState` where available.
- Use `useFormStatus` for pending submit state.
- Shared presentational components may live in `packages/ui`.

Forbidden:

- Keeping tokens in React context.
- Keeping refresh tokens in component state.
- Fetching sensitive user/session information in Client Components when a Server Component can do it.

## 15. `next/image`

Used in:

- Current starter UI.
- Future demo UI only if images are needed.

Purpose:

- Optimized image rendering.

VAuth rules:

- Not part of authentication logic.
- Avoid keeping starter branding/assets in final VAuth UI.
- Use only for actual UI assets.

## 16. `@repo/ui`

Used in:

- `apps/web`.

Purpose:

- Shared UI components.

VAuth rules:

- UI components must be presentational.
- Do not place auth/session logic in `packages/ui`.
- Do not import backend-only types or secrets into `packages/ui`.
- Components exported from `@repo/ui` should be reusable and not tied to the demo app's routes.

Allowed:

```tsx
import { Button } from "@repo/ui/button";
```

Forbidden:

- `@repo/ui` reading cookies.
- `@repo/ui` calling the API directly.
- `@repo/ui` decoding JWTs.

## 17. `@repo/eslint-config`

Used in:

- Workspace apps/packages.

Purpose:

- Shared lint rules.

VAuth rules:

- Prefer updating this package when lint behavior should apply across workspaces.
- Do not duplicate shared lint config in app-level files.

## 18. `@repo/typescript-config`

Used in:

- Workspace apps/packages.

Purpose:

- Shared TypeScript compiler settings.

VAuth rules:

- Prefer extending shared configs.
- Keep app-specific overrides minimal.
- Do not weaken strictness locally without a specific reason.

## 19. `@nestjs/common`

Used in:

- `apps/api`.

Purpose:

- Nest decorators, exceptions, pipes, guards, providers, and core HTTP abstractions.

VAuth rules:

- Use Nest exceptions for expected API failures.
- Use `ValidationPipe` globally.
- Use decorators for controllers, guards, and route metadata.
- Do not throw raw strings or plain objects.

Allowed:

```ts
throw new UnauthorizedException("Invalid email or password");
throw new ForbiddenException("You do not have access to this resource");
```

## 20. `@nestjs/core`

Used in:

- `apps/api`.

Purpose:

- Nest application bootstrap and dependency injection core.

VAuth rules:

- Bootstrap only in `main.ts`.
- Register global pipes, guards, CORS, and middleware before `app.listen(...)`.
- Do not create multiple Nest apps for auth submodules.

## 21. `@nestjs/platform-express`

Used in:

- `apps/api`.

Purpose:

- Express HTTP adapter for NestJS.

VAuth rules:

- Accept the default Nest Express platform.
- Express-specific request/response usage should be isolated.
- Prefer Nest abstractions unless a strategy/middleware requires Express details.

## 22. `@nestjs/mapped-types`

Used in:

- `apps/api` DTOs.

Purpose:

- DTO utilities such as `PartialType`.

VAuth rules:

- Use for update DTOs derived from create DTOs.
- Do not use it to hide unclear API contracts.
- Auth DTOs should remain explicit when security-sensitive.

Allowed:

```ts
export class UpdateClientAppDto extends PartialType(CreateClientAppDto) {}
```

Use explicit DTOs instead for signin/signup/refresh when clarity matters.

## 23. `reflect-metadata`

Used in:

- `apps/api`.

Purpose:

- Required by NestJS decorators and metadata.

VAuth rules:

- Import only through the Nest scaffold/runtime.
- Do not use direct metadata APIs for app logic unless creating decorators.

## 24. `rxjs`

Used in:

- NestJS internals and optional interceptors.

Purpose:

- Observable support in Nest.

VAuth rules:

- Most VAuth services should use `async`/`await`, not Observables.
- Use RxJS only when implementing Nest interceptors or framework patterns that require it.
- Do not introduce Observables into ordinary auth service logic.

## 25. `@prisma/client`

Used in:

- `apps/api`.

Purpose:

- Type-safe database client.

VAuth rules:

- Access Prisma through `PrismaService`.
- Do not instantiate `PrismaClient` outside `PrismaService`.
- Use `select` to avoid leaking sensitive fields.
- Use transactions for multi-write auth flows.
- Do not return raw Prisma records from auth endpoints.

Allowed:

```ts
await this.prisma.$transaction(async (tx) => {
  // create user, credential, membership, audit log
});
```

Forbidden:

- Returning `Credential.passwordHash`.
- Returning `RefreshToken.tokenHash`.
- Catching Prisma errors and forwarding raw messages to clients.

## 26. `prisma`

Used in:

- `apps/api` development tooling.

Purpose:

- Schema management.
- Migrations.
- Client generation.
- Database introspection only when intentionally pulling an existing schema.

VAuth rules:

- VAuth schema is source-controlled in `apps/api/prisma/schema.prisma`.
- Use migrations for schema changes.
- Run generate after schema changes.
- Do not introspect unrelated app-domain tables into VAuth.
- Seed demo data through a script.

Common commands:

```bash
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

## 27. `@prisma/adapter-pg`

Used in:

- `apps/api`.

Purpose:

- PostgreSQL adapter support for Prisma 7.

VAuth rules:

- Use in `PrismaService` when constructing `PrismaClient`; Prisma 7 requires a driver adapter for direct PostgreSQL connections.
- Keep connection URL in `DATABASE_URL`.
- Do not duplicate PostgreSQL connection configuration throughout services.

## 28. `dotenv`

Used in:

- Current Prisma config.

Purpose:

- Load environment variables for Prisma tooling and local scripts.

VAuth rules:

- Backend runtime config should use `@nestjs/config` once added.
- `dotenv` may remain for Prisma CLI config and scripts.
- Do not call `dotenv.config()` in random service files.
- Do not use `dotenv` as a substitute for env validation.

## 29. `class-validator`

Used in:

- NestJS DTO validation.

Purpose:

- Validate incoming API request bodies.

VAuth rules:

- Every public body DTO must use validation decorators.
- Use strong validation for `email`, `password`, `clientId`, `redirectUri`, role names, and permission actions.
- Combine with global `ValidationPipe`.
- Do not rely on TypeScript types for runtime validation.

Allowed:

```ts
export class SignInDto {
  @IsString()
  clientId: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

## 30. `class-transformer`

Used in:

- NestJS validation/transformation.

Purpose:

- Transform request payloads into DTO instances.

VAuth rules:

- Enable transformation in global validation pipe.
- Do not rely on transformation for security decisions by itself.
- Be explicit when converting strings to numbers/booleans.

Required global pattern:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
);
```

## 31. `jest`

Used in:

- `apps/api` tests.

Purpose:

- Unit testing.

VAuth rules:

- Security-sensitive services must have tests.
- Guard tests should cover allow and deny cases.
- Token tests should cover app isolation.
- Do not mock away the behavior being tested.

Required test areas:

- Signup.
- Signin.
- Refresh rotation.
- Refresh reuse detection.
- Signout revocation.
- Role/permission authorization.

## 32. `@nestjs/testing`

Used in:

- `apps/api` unit and integration tests.

Purpose:

- Create Nest testing modules.

VAuth rules:

- Use for service, guard, and controller tests.
- Override providers intentionally.
- Keep test module setup minimal.
- Prefer real service logic with mocked external boundaries.

## 33. `ts-jest`

Used in:

- `apps/api` Jest transform.

Purpose:

- Run TypeScript tests.

VAuth rules:

- Keep Jest config compatible with Nest scaffold unless there is a clear migration.
- Do not introduce a second test runner for backend unit tests without updating standards.

## 34. `supertest`

Used in:

- `apps/api` e2e tests.

Purpose:

- HTTP assertions against the Nest app.

VAuth rules:

- Use for auth endpoint e2e tests.
- Assert status codes, response shape, cookie/header behavior where applicable.
- Do not assert exact token strings.
- Do assert that tokens from one app cannot access another app's routes.

## 35. `ts-node`

Used in:

- Nest/Jest tooling and local scripts.

Purpose:

- Execute TypeScript in development.

VAuth rules:

- Use for dev tooling and scripts only.
- Do not rely on `ts-node` in production runtime.

## 36. `ts-loader`

Used in:

- Nest build tooling.

Purpose:

- TypeScript compilation support.

VAuth rules:

- Leave as scaffold/build dependency.
- Do not reference directly in app code.

## 37. `tsconfig-paths`

Used in:

- Test/debug tooling.

Purpose:

- Resolve TypeScript path aliases at runtime in tooling.

VAuth rules:

- Keep path aliases consistent with `tsconfig`.
- Do not create excessive aliases for local files.
- Prefer relative imports inside the same module.

## 38. `source-map-support`

Used in:

- Backend debugging/runtime support.

Purpose:

- Better stack traces from TypeScript output.

VAuth rules:

- Leave as tooling/runtime support.
- Do not import directly into business logic.

## 39. Type Packages

Installed examples:

- `@types/node`
- `@types/react`
- `@types/react-dom`
- `@types/express`
- `@types/jest`
- `@types/supertest`

Purpose:

- Compile-time typing for libraries and runtimes.

VAuth rules:

- Type packages are dev dependencies.
- Add type packages only when TypeScript needs them.
- Do not import from `@types/*` packages directly.

## 40. Planned/Approved Auth Libraries

These libraries are not all installed yet, but are approved by `build_plan.md` and `code_standards.md` for implementation.

## 41. `@nestjs/config`

Allowed in:

- `apps/api`.

Purpose:

- Centralized backend environment configuration.

VAuth usage:

- Must be global or imported through `ConfigModule`.
- Must validate required env values at startup.
- Services should read config through `ConfigService` or typed config wrappers.
- Do not read `process.env` directly throughout business services.

Required for:

- Database URL.
- JWT secrets and expiries.
- OAuth credentials.
- Web app URL.
- CORS/origin config.

## 42. `@nestjs/passport`

Allowed in:

- `apps/api`.

Purpose:

- Nest integration for Passport strategies and guards.

VAuth usage:

- Use for local auth, JWT auth, refresh-token auth, and Google OAuth.
- Strategy classes live under `auth/strategies` or `oauth`.
- Guards wrap named strategies.
- Business decisions still belong in services.

## 43. `passport`

Allowed in:

- `apps/api`.

Purpose:

- Authentication strategy foundation.

VAuth usage:

- Used indirectly through Nest strategies.
- Do not call Passport APIs directly in controllers.
- Do not use sessions from Passport; VAuth uses JWT plus rotating refresh tokens.

## 44. `passport-local`

Allowed in:

- `apps/api`.

Purpose:

- Email/password credential strategy.

VAuth usage:

- Configure username field as `email`.
- Validate credentials through `AuthService` or `IdentityService`.
- Return sanitized request user only.

Pattern:

```ts
super({ usernameField: "email" });
```

## 45. `passport-jwt`

Allowed in:

- `apps/api`.

Purpose:

- Access-token and refresh-token JWT extraction/validation.

VAuth usage:

- Access token strategy reads `Authorization: Bearer <token>`.
- Refresh token strategy may read body, cookie, or authorization header depending on final API contract.
- Strategies must validate app status and user status when needed.
- Do not trust decoded JWT claims without verifying signature and expected token type.

## 46. `passport-google-oauth20`

Allowed in:

- `apps/api`.

Purpose:

- Google OAuth external login provider.

VAuth usage:

- Validate OAuth state.
- Carry `clientId` and `redirectUri` through state.
- Create or link `ExternalAccount`.
- Issue VAuth tokens after Google identity is verified.
- Do not treat Google access tokens as VAuth access tokens.

## 47. `@nestjs/jwt`

Allowed in:

- `apps/api`.

Purpose:

- JWT signing and verification.

VAuth usage:

- Use separate secrets for access and refresh tokens.
- Keep token signing in `TokenService`.
- Include app scope in token payloads.
- Do not sign tokens in controllers.
- Do not use one secret for all token types.

Alternative:

- `jose` may be chosen instead for advanced JWT/JWK/OIDC work. Do not use both casually for the same backend token responsibility.

## 48. `jose`

Allowed in:

- `apps/web` for encrypted session cookies.
- `apps/api` later if implementing OIDC/JWKS or replacing `@nestjs/jwt`.

Purpose:

- Encrypt/decrypt frontend session cookies.
- Advanced JWT/JWK operations if VAuth becomes an OIDC provider.

VAuth frontend usage:

- Keep session encryption in `apps/web/lib/auth/session.ts`.
- Store app-scoped tokens only in encrypted HTTP-only cookies.
- Do not expose decrypted session data to Client Components except safe user/profile fields.

VAuth backend usage:

- Use for JWKS, asymmetric signing, key rotation, and OIDC if implemented.
- Do not mix with `@nestjs/jwt` without a documented reason.

## 49. `argon2`

Allowed in:

- `apps/api`.

Purpose:

- Password hashing.
- Refresh token hashing.
- Client secret hashing if confidential clients are used.

VAuth usage:

- Use Argon2id.
- Hash passwords before storing in `Credential.passwordHash`.
- Hash refresh tokens before storing in `RefreshToken.tokenHash`.
- Verify using library verification functions.
- Never compare hashes manually.
- Never log input secrets or hashes.

## 50. `cookie-parser`

Allowed in:

- `apps/api` only if backend needs to read cookies.

Purpose:

- Parse cookies from incoming requests.

VAuth usage:

- Prefer Authorization headers for API bearer tokens.
- Use cookies only when a specific browser/session flow requires them.
- If used, register globally in `main.ts`.
- Cookies containing tokens must be HTTP-only and secure in production.

## 51. `helmet`

Allowed in:

- `apps/api`.

Purpose:

- HTTP security headers.

VAuth usage:

- Register during app bootstrap.
- Keep defaults unless a frontend integration requires a specific adjustment.
- Do not disable security headers globally without documenting why.

## 52. `@nestjs/throttler`

Allowed in:

- `apps/api`.

Installed in:

- `apps/api`.

Purpose:

- Rate limiting and abuse reduction.

VAuth usage:

- Register `ThrottlerModule` once in `AppModule`.
- Bind `ThrottlerGuard` globally through `APP_GUARD`.
- Use `@Throttle({ default: { limit, ttl } })` on public auth endpoints for stricter route limits.
- Apply stricter throttling to:
  - signup
  - signin
  - refresh
  - OAuth callback
  - password reset later
- Do not rely on throttling as the only abuse defense.

## 53. `compression`

Allowed in:

- `apps/api`, optional.

Purpose:

- HTTP response compression.

VAuth usage:

- Not required for correctness.
- Avoid compressing responses that contain secrets if it introduces side-channel concerns.
- Prefer adding only after core auth flows are stable.

## 54. `zod`

Allowed in:

- `apps/web`.
- `packages/auth-client` if needed for SDK input validation.

Purpose:

- Frontend form validation.
- Client-side/server-action validation before calling backend.

VAuth usage:

- Use for sign in and sign up server actions.
- Keep schemas in `apps/web/lib/auth/schemas.ts`.
- Do not replace backend DTO validation with Zod unless the backend intentionally migrates.
- Backend remains authoritative even if frontend validation passes.

## 55. `lucide-react`

Allowed in:

- `apps/web`.
- `packages/ui` if shared UI components need icons.

Purpose:

- Icons in buttons, controls, and navigation.

VAuth usage:

- Use icons for visual affordances in the demo/admin UI.
- Do not use for business logic.
- Keep icon usage accessible with text labels or `aria-label`.

## 56. Libraries Not Allowed Without Architecture Change

Do not add these casually:

- `next-auth` / `auth.js`: conflicts with VAuth being the auth platform source of truth.
- A second ORM besides Prisma.
- A custom crypto package instead of `argon2`/`jose`.
- A global frontend state library just for auth.
- A second validation library in the backend while using `class-validator`.
- A second test runner for backend tests while using Jest.

Allowed only after explicit decision:

- `casbin` or OPA client for ABAC/policy engine.
- Redis client for distributed session storage, rate limiting, or token revocation acceleration.
- OpenTelemetry libraries for tracing.
- Email provider SDK for verification/password reset.

## 57. Adding a New Library

Before adding a library:

1. Check whether an existing dependency already solves the problem.
2. Confirm the library belongs in the correct workspace package.
3. Add a section to this file explaining VAuth-specific usage.
4. Update `context/code_standards.md` if it changes implementation rules.
5. Add tests when the library affects auth, tokens, sessions, roles, permissions, or security.

New library checklist:

```txt
Library name:
Workspace:
Purpose:
Allowed usage:
Forbidden usage:
Security notes:
Testing impact:
```
