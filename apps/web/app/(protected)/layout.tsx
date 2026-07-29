import { redirect } from "next/navigation";
import { AppShell } from "../../components/layout/app-shell";
import { getSession } from "../../lib/auth/session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  return <AppShell session={session}>{children}</AppShell>;
}
