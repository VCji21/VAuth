import assert from "node:assert/strict";
import test from "node:test";
import { createAuthClient, VAuthError } from "../src/create-auth-client.js";

type CapturedRequest = {
  url: string;
  init: RequestInit;
};

function createFetchStub(responseBody: unknown, ok = true, status = 200) {
  const requests: CapturedRequest[] = [];
  const fetchStub = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    requests.push({ url: String(url), init: init ?? {} });
    return {
      ok,
      status,
      json: async () => responseBody,
    } as Response;
  }) as typeof fetch;

  return { fetchStub, requests };
}

test("signIn posts credentials with configured clientId", async () => {
  const { fetchStub, requests } = createFetchStub({ accessToken: "token" });
  const auth = createAuthClient({
    apiUrl: "https://vauth.example.test/",
    clientId: "demo_client",
    fetchImpl: fetchStub,
  });

  await auth.signIn({
    email: "user@example.com",
    password: "Password123!",
  });

  assert.equal(requests[0]?.url, "https://vauth.example.test/auth/signin");
  assert.equal(requests[0]?.init.method, "POST");
  assert.deepEqual(JSON.parse(String(requests[0]?.init.body)), {
    email: "user@example.com",
    password: "Password123!",
    clientId: "demo_client",
  });
});

test("exchangeOAuthCode posts a callback code with client context", async () => {
  const { fetchStub, requests } = createFetchStub({ accessToken: "token" });
  const auth = createAuthClient({
    apiUrl: "https://vauth.example.test",
    clientId: "demo_client",
    fetchImpl: fetchStub,
  });

  await auth.exchangeOAuthCode({
    code: "single-use-code",
    redirectUri: "https://app.example.test/auth/callback",
  });

  assert.equal(
    requests[0]?.url,
    "https://vauth.example.test/auth/oauth/exchange",
  );
  assert.deepEqual(JSON.parse(String(requests[0]?.init.body)), {
    code: "single-use-code",
    redirectUri: "https://app.example.test/auth/callback",
    clientId: "demo_client",
  });
});

test("failed requests throw VAuthError with response status", async () => {
  const { fetchStub } = createFetchStub({ message: "nope" }, false, 401);
  const auth = createAuthClient({
    apiUrl: "https://vauth.example.test",
    clientId: "demo_client",
    fetchImpl: fetchStub,
  });

  await assert.rejects(
    auth.refresh({ refreshToken: "expired" }),
    (error) => error instanceof VAuthError && error.status === 401,
  );
});
