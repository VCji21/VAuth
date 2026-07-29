# Frontend Integration: Using VAuth

This document describes how frontend apps use VAuth.

It applies to the demo Next.js client and future projects that consume the VAuth backend.

## 1. Frontend Role

Frontend apps are VAuth clients.

They are not the source of truth for identity, roles, permissions, sessions, or token validity.

The backend owns:

- User identity.
- Credentials.
- Client app registration.
- Memberships.
- Roles.
- Permissions.
- Access token issuance.
- Refresh token rotation.
- Revocation.
- Authorization decisions.

The frontend owns:

- Forms.
- Navigation.
- UI session state.
- Secure cookie storage.
- Calling VAuth APIs.
- User experience around auth states.

## 2. Required Client App Context

Every frontend app that uses VAuth must be registered as a `ClientApp`.

The frontend must know its public `clientId`.

Example env:

```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_CLIENT_ID="vauth_demo_web"
SESSION_SECRET=""
```

Rules:

- `NEXT_PUBLIC_CLIENT_ID` can be public.
- `NEXT_PUBLIC_API_URL` can be public.
- `SESSION_SECRET` must stay private.
- Client secrets must never be exposed in frontend bundles.
- Frontend requests must include `clientId` when signing up, signing in, or starting OAuth.

## 3. Session Strategy

The demo Next.js client stores session data in an encrypted HTTP-only cookie.

Session payload:

```ts
type WebSession = {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  clientId: string;
  appId: string;
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
};
```

Rules:

- Do not store tokens in `localStorage`.
- Do not store tokens in `sessionStorage`.
- Do not store tokens in browser-readable cookies.
- Do not pass refresh tokens to Client Components.
- Decrypt sessions only in server contexts.
- Use HTTP-only, secure, SameSite cookies.

Recommended cookie:

```txt
name: session
httpOnly: true
secure: true in production
sameSite: lax
path: /
```

## 4. Signup Flow

Frontend flow:

```txt
signup form
  -> server action validates form
  -> server action calls POST /auth/signup
  -> VAuth returns user + token pair
  -> server action creates encrypted session cookie
  -> redirect to /dashboard
```

Required request shape:

```ts
type SignUpRequest = {
  clientId: string;
  name: string;
  email: string;
  password: string;
};
```

Rules:

- Validate fields before calling VAuth.
- Backend validation is still authoritative.
- Never return token pair to a Client Component.
- Show safe field/form errors only.

## 5. Signin Flow

Frontend flow:

```txt
signin form
  -> server action validates form
  -> server action calls POST /auth/signin
  -> VAuth returns user + token pair
  -> server action creates encrypted session cookie
  -> redirect to /dashboard
```

Required request shape:

```ts
type SignInRequest = {
  clientId: string;
  email: string;
  password: string;
};
```

Rules:

- Use a generic error for failed signin.
- Do not reveal whether the email exists.
- Do not expose raw backend errors.

## 6. Google OAuth Flow

Frontend starts OAuth by navigating to VAuth:

```txt
GET {API_URL}/auth/google?clientId={CLIENT_ID}&redirectUri={CALLBACK_URL}
```

Flow:

```txt
user clicks Continue with Google
  -> browser goes to VAuth Google route
  -> VAuth redirects to Google
  -> Google redirects back to VAuth
  -> VAuth validates state
  -> VAuth creates a one-time callback code
  -> VAuth redirects to frontend /auth/callback?code=...
  -> frontend route handler exchanges code server-side
  -> frontend route handler stores encrypted session
  -> frontend redirects to /dashboard
```

Rules:

- `redirectUri` must be registered in VAuth.
- OAuth callback handling must happen in a Route Handler.
- Callback codes must be exchanged server-side immediately.
- Tokens from the exchange must be stored server-side immediately.
- Do not render tokens on a page.
- Do not put Google tokens into the frontend session.
- Do not put VAuth access or refresh tokens in callback query params.

## 7. `authFetch`

Frontend server code should use `authFetch` for protected backend calls.

Behavior:

```txt
read encrypted session
attach Authorization: Bearer accessToken
call VAuth API
if response is not 401:
  return response
if response is 401:
  call /auth/refresh with refreshToken
  update encrypted session
  retry original request once
if refresh fails:
  delete session
  redirect to /signin
```

Rules:

- Retry only once.
- Refresh only in server contexts.
- Update the session cookie after refresh.
- Clear session if refresh fails.
- Do not call `authFetch` from Client Components unless a future browser-safe wrapper is explicitly designed.

## 8. Middleware Protection

Next.js middleware protects frontend routes for user experience.

Protected routes:

```txt
/dashboard
/profile
/admin
```

Public routes:

```txt
/
/signin
/signup
/auth/callback
```

Rules:

- Anonymous users visiting protected pages redirect to `/signin`.
- Signed-in users visiting `/signin` or `/signup` redirect to `/dashboard`.
- Users without admin permission cannot access `/admin`.
- Middleware is not final security. Backend authorization is final.

## 9. Frontend Permission Checks

Frontend may use roles and permissions from the encrypted session to improve UX.

Allowed:

- Hide admin navigation.
- Show/hide action buttons.
- Redirect away from pages that obviously require missing permissions.
- Show a 403 page.

Forbidden:

- Trust frontend permission checks as security.
- Call protected backend routes without backend authorization.
- Let users set their own roles or permissions in the frontend.

Helper shape:

```ts
function hasPermission(session: WebSession, permission: string): boolean {
  return session.permissions.includes(permission);
}
```

## 10. Route Handler Responsibilities

Allowed Route Handlers:

```txt
app/auth/callback/route.ts
app/api/auth/session/route.ts
app/api/auth/signout/route.ts
```

Responsibilities:

- Create session cookie.
- Update session cookie.
- Delete session cookie.
- Redirect after OAuth callback.
- Proxy only session-specific calls when needed.

Forbidden:

- Implementing backend auth business logic.
- Reading or writing the database.
- Creating roles or permissions directly.
- Validating passwords locally.

## 11. Server Action Responsibilities

Use Server Actions for auth forms.

Allowed:

- Validate form data.
- Call VAuth auth endpoints.
- Create encrypted session cookies.
- Return typed form state.
- Redirect after success.

Forbidden:

- Returning raw tokens to Client Components.
- Mutating database directly.
- Duplicating backend authorization logic.

Recommended state:

```ts
type ActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};
```

## 12. Error Handling

Frontend should translate backend errors into safe UI messages.

Rules:

- Signin failure: `Invalid email or password.`
- Expired session: `Your session expired. Please sign in again.`
- Forbidden page: `You do not have access to this page.`
- Duplicate signup: show a safe account conflict message.
- Do not show stack traces.
- Do not show raw Prisma/Nest errors.
- Do not show token validation internals.

## 13. Frontend File Map

Recommended Next.js structure:

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
  admin/

apps/web/lib/
  auth/
    actions.ts
    auth-fetch.ts
    session.ts
    schemas.ts
    types.ts
  api.ts
```

## 14. Frontend SDK Usage

Frontend apps should use `packages/auth-client` for raw VAuth auth API calls.

```ts
const auth = createAuthClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
});
```

Rules:

- SDK wraps HTTP contracts.
- Frontend still owns encrypted cookie storage.
- SDK must not assume all clients are Next.js apps.
- Next-specific helpers may live in a separate adapter later.

## 15. Frontend Success Criteria

Frontend integration is successful when:

- Signup works through VAuth.
- Signin works through VAuth.
- Google OAuth works through VAuth.
- Session is encrypted and HTTP-only.
- Protected pages redirect correctly.
- `authFetch` refreshes expired access tokens.
- Signout revokes backend refresh state and clears frontend session.
- Admin UI only appears for users with required permissions.
- No tokens are exposed to browser-readable storage.
