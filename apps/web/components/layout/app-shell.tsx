import Link from "next/link";
import { LayoutDashboard, LockKeyhole, LogOut, Shield, User } from "lucide-react";
import type { WebSession } from "../../lib/auth/types";

type AppShellProps = {
  session: WebSession;
  children: React.ReactNode;
};

export function AppShell({ session, children }: AppShellProps) {
  const canViewAdmin =
    session.permissions.includes("admin:read") ||
    session.roles.some((role) => role === "admin" || role === "owner");

  return (
    <div className="app-shell">
      <header className="top-nav">
        <Link href="/dashboard" className="brand">
          <Shield size={20} aria-hidden />
          <span>VAuth</span>
        </Link>
        <div className="top-nav-meta">
          <span>{session.clientId}</span>
          <form action="/api/auth/signout" method="post">
            <button className="icon-button" aria-label="Sign out" title="Sign out">
              <LogOut size={16} aria-hidden />
            </button>
          </form>
        </div>
      </header>
      <div className="shell-body">
        <nav className="sidebar" aria-label="Protected navigation">
          <Link href="/dashboard">
            <LayoutDashboard size={16} aria-hidden />
            Dashboard
          </Link>
          <Link href="/profile">
            <User size={16} aria-hidden />
            Profile
          </Link>
          {canViewAdmin ? (
            <Link href="/admin">
              <LockKeyhole size={16} aria-hidden />
              Admin
            </Link>
          ) : null}
        </nav>
        <main className="shell-main">{children}</main>
      </div>
    </div>
  );
}
