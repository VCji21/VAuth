import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptSession,
  encryptSession,
  SESSION_COOKIE_NAME,
} from "../lib/auth/session-core.ts";
import type { WebSession } from "../lib/auth/types.ts";

const validSecret = "test-session-secret-at-least-32-characters";
const sampleSession: WebSession = {
  user: {
    id: "user_1",
    email: "user@example.com",
    name: "Test User",
  },
  clientId: "vauth_demo_web",
  appId: "app_1",
  roles: ["member"],
  permissions: ["profile:read"],
  accessToken: "access-token",
  refreshToken: "refresh-token",
};

test("uses the stable session cookie name", () => {
  assert.equal(SESSION_COOKIE_NAME, "session");
});

test("encrypts and decrypts a web session", async () => {
  process.env.SESSION_SECRET = validSecret;

  const encrypted = await encryptSession(sampleSession);

  assert.notEqual(encrypted, "");
  assert.equal(encrypted.includes(sampleSession.refreshToken), false);
  assert.deepEqual(await decryptSession(encrypted), sampleSession);
});

test("returns null for missing or invalid session values", async () => {
  process.env.SESSION_SECRET = validSecret;

  assert.equal(await decryptSession(), null);
  assert.equal(await decryptSession("not-a-session"), null);
});

test("fails closed when the session secret is too short", async () => {
  process.env.SESSION_SECRET = "too-short";

  await assert.rejects(() => encryptSession(sampleSession), {
    message: "SESSION_SECRET must be at least 32 characters.",
  });
});
