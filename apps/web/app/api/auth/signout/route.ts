import { NextResponse } from "next/server";
import { getVAuthClient } from "../../../../lib/auth/client";
import { clearSession, getSession } from "../../../../lib/auth/session";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (session) {
    await getVAuthClient()
      .signOut({ refreshToken: session.refreshToken })
      .catch(() => undefined);
  }

  await clearSession();
  return NextResponse.redirect(new URL("/signin", request.url), 303);
}
