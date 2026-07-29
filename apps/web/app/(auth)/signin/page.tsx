import { redirect } from "next/navigation";
import { SignInForm } from "../../../components/auth/sign-in-form";
import { getSession } from "../../../lib/auth/session";

export default async function SignInPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-page">
      <SignInForm />
    </main>
  );
}
