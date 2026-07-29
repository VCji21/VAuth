import assert from "node:assert/strict";
import test from "node:test";
import { getRouteDecision } from "../lib/auth/route-policy.ts";

const memberSession = {
  roles: ["member"],
  permissions: ["profile:read", "profile:update"],
};

test("redirects anonymous users away from protected routes", () => {
  assert.deepEqual(getRouteDecision("/dashboard", null), {
    type: "redirect",
    pathname: "/signin",
  });
  assert.deepEqual(getRouteDecision("/profile/settings", null), {
    type: "redirect",
    pathname: "/signin",
  });
});

test("redirects signed-in users away from auth pages", () => {
  assert.deepEqual(getRouteDecision("/signin", memberSession), {
    type: "redirect",
    pathname: "/dashboard",
  });
  assert.deepEqual(getRouteDecision("/signup", memberSession), {
    type: "redirect",
    pathname: "/dashboard",
  });
});

test("keeps non-admin users out of admin routes", () => {
  assert.deepEqual(getRouteDecision("/admin", memberSession), {
    type: "redirect",
    pathname: "/dashboard",
  });
});

test("allows admin routes for admin permission or role", () => {
  assert.deepEqual(
    getRouteDecision("/admin", {
      roles: ["member"],
      permissions: ["admin:read"],
    }),
    { type: "next" },
  );
  assert.deepEqual(
    getRouteDecision("/admin/apps", {
      roles: ["owner"],
      permissions: [],
    }),
    { type: "next" },
  );
});

test("allows public routes without a session", () => {
  assert.deepEqual(getRouteDecision("/", null), { type: "next" });
});
