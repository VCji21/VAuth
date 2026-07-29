"use server";

import { VAuthError } from "@repo/auth-client";
import { redirect } from "next/navigation";
import { getVAuthClient } from "./client";
import { setSession, toWebSession } from "./session";
import { signInSchema, signUpSchema } from "./schemas";
import type { ActionState } from "./types";

const genericSignInError = "Invalid email or password.";

export async function signInAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await getVAuthClient().signIn(parsed.data);
    await setSession(toWebSession(auth));
  } catch (error) {
    const message = error instanceof VAuthError
      ? error.status === 401
        ? genericSignInError
        : "Authentication failed."
      : "Authentication service is unavailable.";
    return {
      success: false,
      message,
    };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const auth = await getVAuthClient().signUp(parsed.data);
    await setSession(toWebSession(auth));
  } catch {
    return {
      success: false,
      message: "We could not create that account. Try signing in instead.",
    };
  }

  redirect("/dashboard");
}
