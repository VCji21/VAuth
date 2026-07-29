import { NextRequest, NextResponse } from "next/server";
import { getVAuthClient } from "../../../lib/auth/client";
import { setSession, toWebSession } from "../../../lib/auth/session";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/signin?error=oauth", request.url));
  }

  try {
    const authResponse = await getVAuthClient().exchangeOAuthCode({
      code,
      redirectUri: new URL("/auth/callback", request.url).toString(),
    });
    await setSession(toWebSession(authResponse));
  } catch {
    return NextResponse.redirect(new URL("/signin?error=oauth", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
