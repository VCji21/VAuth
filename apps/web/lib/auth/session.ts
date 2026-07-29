import { cookies } from "next/headers";
import { decryptSession, encryptSession, SESSION_COOKIE_NAME } from "./session-core";
import type { WebSession } from "./types";

export async function getSession(): Promise<WebSession | null> {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function setSession(session: WebSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await encryptSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function toWebSession(response: {
  user: WebSession["user"];
  app: { id: string; clientId: string };
  roles: string[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
}): WebSession {
  return {
    user: response.user,
    appId: response.app.id,
    clientId: response.app.clientId,
    roles: response.roles,
    permissions: response.permissions,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  };
}
