import { redirect } from "next/navigation";
import { getApiUrl } from "../api";
import { getVAuthClient } from "./client";
import { clearSession, getSession, setSession, toWebSession } from "./session";

export async function authFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  const request = () =>
    fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

  const response = await request();
  if (response.status !== 401) {
    return response;
  }

  let refreshed;
  try {
    refreshed = await getVAuthClient().refresh({
      refreshToken: session.refreshToken,
    });
  } catch {
    await clearSession();
    redirect("/signin");
  }

  await setSession(toWebSession(refreshed));

  return fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${refreshed.accessToken}`,
    },
    cache: "no-store",
  });
}
