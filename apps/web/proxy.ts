import { NextRequest, NextResponse } from "next/server";
import { getRouteDecision } from "./lib/auth/route-policy";
import { decryptSession, SESSION_COOKIE_NAME } from "./lib/auth/session-core";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const session = await decryptSession(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  const decision = getRouteDecision(pathname, session);

  if (decision.type === "redirect") {
    return NextResponse.redirect(new URL(decision.pathname, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/signin",
    "/signup",
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
