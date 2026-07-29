import { PageHeader } from "../../../components/layout/page-header";
import { Badge } from "../../../components/ui/badge";
import { getSession } from "../../../lib/auth/session";

export default async function ProfilePage() {
  const session = await getSession();

  return (
    <section className="content-stack">
      <PageHeader
        title="Profile"
        description="Sanitized identity and app-scoped authorization data from VAuth."
      />
      <div className="panel">
        <dl className="detail-list">
          <div>
            <dt>Name</dt>
            <dd>{session?.user.name ?? "Not set"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{session?.user.email}</dd>
          </div>
          <div>
            <dt>App ID</dt>
            <dd>{session?.appId}</dd>
          </div>
          <div>
            <dt>Permissions</dt>
            <dd className="badge-list">
              {session?.permissions.map((permission) => (
                <Badge key={permission}>{permission}</Badge>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
