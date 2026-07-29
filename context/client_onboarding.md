# Client Onboarding: Integrating an App with VAuth

This guide shows how a frontend app integrates with VAuth as a registered client.

## 1. Register the Client App

Create or seed a `ClientApp` with:

- `clientId`: public identifier used by the frontend.
- `allowedOrigins`: browser origins allowed to use this app.
- `redirectUris`: exact OAuth callback URLs allowed after provider login.
- app-scoped roles and permissions.

Demo seed values:

```txt
clientId: vauth_demo_web
allowedOrigins:
  - http://localhost:3000
redirectUris:
  - http://localhost:3000/auth/callback
```

## 2. Configure Frontend Env

```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_CLIENT_ID="vauth_demo_web"
SESSION_SECRET="replace-with-at-least-32-random-characters"
```

Rules:

- `NEXT_PUBLIC_CLIENT_ID` is safe to expose.
- `SESSION_SECRET` must stay server-only.
- Do not expose client secrets or token values to browser JavaScript.

## 3. Install the SDK

Workspace apps can depend on:

```json
{
  "dependencies": {
    "@repo/auth-client": "*"
  }
}
```

Build the package before consuming from a clean workspace:

```sh
npm run build --workspace @repo/auth-client
```

Create a client:

```ts
import { createAuthClient } from "@repo/auth-client";

const auth = createAuthClient({
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID ?? "vauth_demo_web",
});
```

## 4. Email Auth

Signup:

```ts
const session = await auth.signUp({ name, email, password });
```

Signin:

```ts
const session = await auth.signIn({ email, password });
```

The response contains app-scoped tokens, roles, permissions, user, and app data.
Store it only in server-managed secure storage such as an encrypted HTTP-only
cookie.

## 5. Refresh and Signout

Refresh:

```ts
const refreshed = await auth.refresh({ refreshToken });
```

Sign out current session:

```ts
await auth.signOut({ refreshToken });
```

Sign out all active sessions for the same user/app:

```ts
await auth.signOut({ refreshToken, allSessions: true });
```

## 6. Google OAuth

Start OAuth by navigating the browser to VAuth:

```txt
GET {API_URL}/auth/google?clientId={CLIENT_ID}&redirectUri={CALLBACK_URL}
```

After Google login, VAuth redirects to:

```txt
{CALLBACK_URL}?code={ONE_TIME_CODE}
```

The frontend callback route must exchange the code server-side:

```ts
const session = await auth.exchangeOAuthCode({
  code,
  redirectUri: "http://localhost:3000/auth/callback",
});
```

The code can be used once and expires quickly. Tokens are returned only from the
server-side POST exchange, not through the browser URL.

## 7. Protected API Calls

Call protected VAuth APIs with the access token:

```ts
await fetch(`${apiUrl}/auth/me`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

If a protected call returns `401`, refresh server-side and retry once. If refresh
fails, clear the frontend session and send the user back to signin.

## 8. Security Checklist

- Keep refresh tokens out of Client Components.
- Keep tokens out of `localStorage`, `sessionStorage`, and browser-readable cookies.
- Validate form inputs before calling VAuth, but rely on VAuth as authoritative.
- Treat frontend permissions as UX only.
- Register every OAuth callback URL exactly in `redirectUris`.
- Use HTTPS and secure cookies in production.
