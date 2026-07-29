# Project Overview: VAuth

VAuth is a reusable authentication platform built with NestJS, Next.js, Prisma, PostgreSQL, and Turborepo.

It is designed to be created once and reused across many future projects.

## 1. What VAuth Is

VAuth is a central authentication and authorization service.

Instead of every new project building its own signup, signin, token handling, roles, permissions, sessions, and OAuth integration, each project can register with VAuth and use the same backend identity system.

The backend is the core product. The frontend is a reference client that shows how another app consumes the backend.

Core idea:

```txt
Project A
Project B
Project C
  -> all authenticate through VAuth
  -> each app gets its own roles and permissions
  -> users receive app-scoped tokens
```

## 2. Problem It Solves

Most projects need authentication, but repeatedly rebuilding it creates problems:

- Duplicate signup and signin logic.
- Inconsistent password security.
- Inconsistent token handling.
- Hard-coded roles that do not fit every app.
- Frontend apps accidentally owning sensitive auth logic.
- Hard-to-revoke sessions.
- No central view of users across projects.
- Difficult migration path toward SSO.

VAuth solves this by centralizing identity and access control while still allowing each app to define its own roles and permissions.

## 3. Target Users

Primary users:

- Developers building multiple apps.
- Solo builders who want reusable auth infrastructure.
- Teams that need a shared internal authentication service.
- Future projects that need auth without rebuilding it.

Secondary users:

- Admins who manage client apps, roles, permissions, and memberships.
- End users who sign up, sign in, and access protected apps.

## 4. Core Functionalities

First version functionality:

- Register client apps.
- Define app-specific roles.
- Define app-specific permissions.
- Assign users to apps.
- Assign roles to users per app.
- Sign up with email and password.
- Sign in with email and password.
- Sign in with Google OAuth.
- Issue app-scoped access tokens.
- Issue rotating refresh tokens.
- Revoke sessions on signout.
- Protect backend APIs by default.
- Mark selected routes as public.
- Enforce role and permission checks in the backend.
- Store frontend sessions in encrypted HTTP-only cookies.
- Provide a demo Next.js client.

Important design point:

- Roles are not hard-coded enums.
- Roles are database records owned by a client app.
- Permissions are also database records owned by a client app.

## 5. Data Architecture

VAuth uses an auth-first relational data model.

Core entities:

- `User`: central user identity.
- `Credential`: local password credential stored separately from profile data.
- `ExternalAccount`: OAuth identities such as Google.
- `ClientApp`: an application registered to use VAuth.
- `AppMembership`: connects a user to one client app.
- `Role`: app-scoped role such as `owner`, `admin`, or `member`.
- `Permission`: app-scoped permission such as `profile:read` or `members:manage`.
- `UserRole`: assigns roles to a user's app membership.
- `RolePermission`: assigns permissions to a role.
- `RefreshToken`: stores hashed, app-scoped refresh tokens.
- `AuditLog`: records security and admin events.

High-level relationship:

```txt
User
  -> AppMembership
    -> ClientApp
    -> UserRole
      -> Role
        -> RolePermission
          -> Permission
```

Token relationship:

```txt
User + ClientApp + Membership
  -> app-scoped access token
  -> app-scoped rotating refresh token
```

## 6. Core App Flow

### Client App Setup

1. A project is registered as a `ClientApp`.
2. The app receives a `clientId`.
3. Allowed origins and redirect URIs are configured.
4. App-specific roles are created.
5. App-specific permissions are created.
6. Roles are mapped to permissions.

### Email Signup Flow

1. User opens the client app.
2. User submits signup form.
3. Client sends name, email, password, and `clientId` to VAuth.
4. VAuth validates the target client app.
5. VAuth creates the user if needed.
6. VAuth stores the password as an Argon2id hash.
7. VAuth creates app membership.
8. VAuth assigns the default app role.
9. VAuth issues an access token and refresh token.
10. Client stores the session in an encrypted HTTP-only cookie.

### Email Signin Flow

1. User submits email, password, and `clientId`.
2. VAuth validates the user credential.
3. VAuth loads the user's membership for that app.
4. VAuth loads roles and permissions for that app.
5. VAuth issues an app-scoped token pair.
6. Client stores the session securely.

### Token Refresh Flow

1. Client calls a protected backend route with access token.
2. If access token is expired, client calls refresh endpoint.
3. VAuth verifies the refresh token.
4. VAuth checks the stored refresh token hash.
5. VAuth rotates the refresh token.
6. VAuth returns a fresh token pair.
7. Client updates the encrypted session.

### Signout Flow

1. User signs out.
2. Client calls VAuth signout.
3. VAuth revokes the current refresh token or token family.
4. Client deletes the encrypted session cookie.

### Google OAuth Flow

1. User clicks "Continue with Google".
2. Client starts Google auth through VAuth with `clientId` and `redirectUri`.
3. VAuth redirects to Google.
4. Google redirects back to VAuth.
5. VAuth validates OAuth state.
6. VAuth creates or links the external Google account.
7. VAuth creates app membership if policy allows.
8. VAuth creates a short-lived one-time callback code.
9. VAuth redirects back to the client app callback with the code.
10. The client callback route exchanges the code server-side for app-scoped tokens.

## 7. User Interface

The first frontend is a demo/reference client, not the main source of truth.

Its job is to prove:

- Another app can use VAuth.
- Auth requests include `clientId`.
- Sessions can be stored securely.
- Protected pages can be guarded.
- Role and permission checks can affect the UI.

UI style:

- Clean developer-focused interface.
- Simple forms.
- Clear protected pages.
- Minimal admin controls at first.
- No marketing landing page unless needed later.

## 8. Navigation and Pages

Initial demo pages:

```txt
/                       Optional home or redirect page
/signup                 Create account
/signin                 Sign in
/dashboard              Protected user dashboard
/profile                Protected profile page
/admin                  Protected admin-only page
/auth/callback          OAuth callback handler
```

Possible admin/reference pages:

```txt
/admin/apps             Manage client apps
/admin/apps/new         Create client app
/admin/apps/[id]        View client app details
/admin/apps/[id]/roles  Manage roles
/admin/apps/[id]/permissions Manage permissions
/admin/apps/[id]/members Manage memberships
```

Navigation behavior:

- Anonymous users can access public auth pages.
- Anonymous users are redirected away from protected pages.
- Signed-in users are redirected away from signin/signup pages.
- Non-admin users cannot access admin pages.
- Backend authorization still decides final access.

## 9. API Surface

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

POST   /clients/:clientId/memberships
GET    /clients/:clientId/memberships
PATCH  /clients/:clientId/memberships/:membershipId/roles
DELETE /clients/:clientId/memberships/:membershipId
```

## 10. Success Criteria

VAuth is successful when:

- A new app can register with VAuth.
- The app can define its own roles and permissions.
- A user can sign up for that app.
- A user can sign in to that app.
- A user can sign in with Google for that app.
- VAuth issues app-scoped tokens.
- Token refresh works with rotation.
- Signout revokes refresh access.
- Backend routes are protected by default.
- Permissions are enforced per app.
- A token for one app cannot authorize another app.
- The demo Next.js app proves the full integration flow.
- Setup and onboarding are documented clearly enough for future projects.

## 11. Features Out of Scope for First Version

Out of scope initially:

- Full OIDC provider implementation.
- SAML.
- Multi-factor authentication.
- Passkeys/WebAuthn.
- Email verification.
- Password reset.
- Organization/team billing.
- Enterprise audit exports.
- Device/session management UI.
- Admin analytics dashboard.
- Hosted public auth pages for arbitrary clients.
- Multi-region deployment.

These are not rejected permanently. They are deferred so the core reusable auth platform can become stable first.

## 12. Future Scope

Likely future additions:

- Full OAuth2/OIDC provider mode.
- Authorization Code with PKCE.
- JWKS endpoint and key rotation.
- `id_token` support.
- `/oauth/userinfo`.
- `/oauth/introspect`.
- Email verification.
- Password reset.
- MFA with TOTP.
- Passkeys/WebAuthn.
- Invite-based app membership.
- Organization model for client app ownership.
- Admin UI for apps, roles, permissions, and members.
- Reusable `packages/auth-client` SDK.
- Webhooks for auth events.
- Audit log search and export.
- Redis-backed rate limiting or token revocation acceleration.

## 13. Non-Goals

VAuth should not become:

- A blog platform.
- A product management app.
- A generic dashboard template.
- A frontend-only auth solution.
- A wrapper around NextAuth/Auth.js.
- A system where each consuming app defines auth differently.

The value of VAuth is consistency, centralization, and reusable auth infrastructure.

## 14. Project Documentation Map

Use these documents together:

- `context/agent_start_here.md`: first-read guide for agents, doc usage, workflow, package-doc rules, and permanent project rules.
- `context/project_overview.md`: product explanation and scope.
- `context/architecture.md`: system design and architectural decisions.
- `context/build_plan.md`: implementation phases and acceptance criteria.
- `context/code_standards.md`: coding rules and conventions.
- `context/library_docs.md`: project-specific third-party library usage.
- `context/ui_system.md`: demo client UI rules, tokens, and component registry.
- `context/frontend_integration.md`: how frontend apps consume VAuth.
- `context/client_onboarding.md`: concrete integration steps for another app.
- `context/progress_tracker.md`: implementation status, decisions, blockers, and verification.
