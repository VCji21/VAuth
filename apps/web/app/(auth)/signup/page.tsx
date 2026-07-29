import { redirect } from "next/navigation";
import { SignUpForm } from "../../../components/auth/sign-up-form";
import { getSession } from "../../../lib/auth/session";

export default async function SignUpPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-page">
      <SignUpForm />
    </main>
  );
}
