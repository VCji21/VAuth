"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction } from "../../lib/auth/actions";
import type { ActionState } from "../../lib/auth/types";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { GoogleSignInButton } from "./google-sign-in-button";

const initialState: ActionState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="full-width" disabled={pending}>
      <LogIn size={16} aria-hidden />
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

export function SignInForm() {
  const [state, action] = useActionState(signInAction, initialState);

  return (
    <form className="auth-form" action={action}>
      <div className="auth-heading">
        <p className="eyebrow">VAuth demo client</p>
        <h1>Sign in</h1>
        <p>Access the protected reference app with app-scoped tokens.</p>
      </div>
      {state.message ? <Alert>{state.message}</Alert> : null}
      <Input label="Email" name="email" type="email" error={state.fieldErrors?.email} />
      <Input label="Password" name="password" type="password" error={state.fieldErrors?.password} />
      <SubmitButton />
      <GoogleSignInButton />
      <p className="auth-switch">
        No account yet? <Link href="/signup">Sign up</Link>
      </p>
    </form>
  );
}
