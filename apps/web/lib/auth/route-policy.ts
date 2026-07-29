import type { WebSession } from "./types";

export type RouteDecision =
  | { type: "next" }
  | { type: "redirect"; pathname: string };

const protectedRoutes = ["/dashboard", "/profile", "/admin"];

export function getRouteDecision(
  pathname: string,
  session: Pick<WebSession, "permissions" | "roles"> | null,
): RouteDecision {
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthPage = pathname === "/signin" || pathname === "/signup";

  if (isProtected && !session) {
    return { type: "redirect", pathname: "/signin" };
  }

  if (isAuthPage && session) {
    return { type: "redirect", pathname: "/dashboard" };
  }

  if (pathname.startsWith("/admin") && session) {
    const allowed =
      session.permissions.includes("admin:read") ||
      session.roles.some((role) => role === "admin" || role === "owner");
    if (!allowed) {
      return { type: "redirect", pathname: "/dashboard" };
    }
  }

  return { type: "next" };
}
