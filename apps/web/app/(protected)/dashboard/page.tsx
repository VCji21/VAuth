import { PageHeader } from "../../../components/layout/page-header";
import { Badge } from "../../../components/ui/badge";
import { getSession } from "../../../lib/auth/session";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <section className="content-stack">
      <PageHeader
        title="Dashboard"
        description="A protected reference page backed by the encrypted VAuth session."
      />
      <div className="metric-grid">
        <div className="panel">
          <span className="panel-label">Client app</span>
          <strong>{session?.clientId}</strong>
        </div>
        <div className="panel">
          <span className="panel-label">Roles</span>
          <div className="badge-list">
            {session?.roles.map((role) => <Badge key={role}>{role}</Badge>)}
          </div>
        </div>
        <div className="panel">
          <span className="panel-label">Permissions</span>
          <strong>{session?.permissions.length ?? 0}</strong>
        </div>
      </div>
    </section>
  );
}
