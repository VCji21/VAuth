# @repo/auth-client

Typed VAuth HTTP client for future consuming apps.

Build before consuming from a clean workspace:

```sh
npm run build --workspace @repo/auth-client
```

```ts
import { createAuthClient } from "@repo/auth-client";

const auth = createAuthClient({
  apiUrl: "http://localhost:8000",
  clientId: "vauth_demo_web",
});

await auth.signIn({ email, password });
await auth.exchangeOAuthCode({
  code,
  redirectUri: "http://localhost:3000/auth/callback",
});
```

The client wraps VAuth API contracts only. Frontend apps still own secure
session storage, cookie handling, redirects, and UI state.
