import { EncryptJWT, jwtDecrypt } from "jose";
import type { WebSession } from "./types";

const SESSION_COOKIE_NAME = "session";

async function getKey(): Promise<Uint8Array> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.");
  }
  const encoded = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(digest);
}

export { SESSION_COOKIE_NAME };

export async function encryptSession(session: WebSession): Promise<string> {
  return new EncryptJWT({ session })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(await getKey());
}

export async function decryptSession(value?: string): Promise<WebSession | null> {
  if (!value) {
    return null;
  }

  try {
    const { payload } = await jwtDecrypt<{ session: WebSession }>(
      value,
      await getKey(),
    );
    return payload.session ?? null;
  } catch {
    return null;
  }
}
