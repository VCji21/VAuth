import { redirect } from "next/navigation";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { getSession } from "../../lib/auth/session";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  const allowed =
    session.permissions.includes("admin:read") ||
    session.roles.some((role) => role === "admin" || role === "owner");

  if (!allowed) {
    return (
      <main className="auth-page">
        <div className="panel narrow-panel">
          <p className="eyebrow">403</p>
          <h1>You do not have access to this page.</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="shell-main standalone-main">
      <section className="content-stack">
        <PageHeader
          title="Admin"
          description="Reference admin area gated by app-scoped roles and permissions."
        />
        <div className="panel">
          <span className="panel-label">Effective permissions</span>
          <div className="badge-list">
            {session.permissions.map((permission) => (
              <Badge key={permission}>{permission}</Badge>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
