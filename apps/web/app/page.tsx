import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSession } from "../lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-page">
      <div className="panel narrow-panel">
        <div className="brand-mark">
          <ShieldCheck size={24} aria-hidden />
          <span>VAuth</span>
        </div>
        <h1>Reusable auth, app-scoped by default.</h1>
        <p>
          Use the demo client to sign in, create a session, and inspect roles
          and permissions issued by the VAuth backend.
        </p>
        <div className="button-row">
          <a className="button button-primary" href="/signin">
            Sign in
          </a>
          <a className="button button-secondary" href="/signup">
            Sign up
          </a>
        </div>
      </div>
    </main>
  );
}
