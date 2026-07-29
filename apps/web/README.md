# VAuth Web

Next.js reference client for VAuth.

The web app proves how an external frontend should consume VAuth:

- signup/signin through backend API calls,
- encrypted HTTP-only session cookie,
- server-side token refresh through `authFetch`,
- protected dashboard/profile/admin routes,
- Google OAuth callback handling,
- raw VAuth auth calls through `@repo/auth-client`,
- frontend permission checks for UX only.

## Env

Copy `.env.example` to `.env.local`.

```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_CLIENT_ID="vauth_demo_web"
SESSION_SECRET="replace-with-at-least-32-random-characters"
```

Tokens are never stored in localStorage, sessionStorage, or browser-readable
cookies.

## Run

```sh
npm run build --workspace @repo/auth-client
npm run dev
```

Open `http://localhost:3000`.

## Verify

```sh
npm test
npm run build
npm run check-types
```
