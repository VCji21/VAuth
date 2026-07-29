"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpAction } from "../../lib/auth/actions";
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
      <UserPlus size={16} aria-hidden />
      {pending ? "Creating account..." : "Sign up"}
    </Button>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, initialState);

  return (
    <form className="auth-form" action={action}>
      <div className="auth-heading">
        <p className="eyebrow">VAuth demo client</p>
        <h1>Create account</h1>
        <p>Join the demo app and receive a VAuth-managed session.</p>
      </div>
      {state.message ? <Alert>{state.message}</Alert> : null}
      <Input label="Name" name="name" error={state.fieldErrors?.name} />
      <Input label="Email" name="email" type="email" error={state.fieldErrors?.email} />
      <Input label="Password" name="password" type="password" error={state.fieldErrors?.password} />
      <SubmitButton />
      <GoogleSignInButton />
      <p className="auth-switch">
        Already have an account? <Link href="/signin">Sign in</Link>
      </p>
    </form>
  );
}
