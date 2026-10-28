"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, signUpAction, type AuthFormState } from "@/app/actions/auth";
import { Alert, Button, Field, Input } from "@/components/ui/primitives";

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signInAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email ?? ""} /></Field>
      <Field label="Password" htmlFor="password"><Input id="password" name="password" type="password" autoComplete="current-password" required /></Field>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Signing in…" : "Enter the archive"}</Button>
      <p className="text-center text-xs text-slate-mist">No account? <Link href="/sign-up" className="text-gold underline">Begin research</Link></p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signUpAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Display name" htmlFor="displayName"><Input id="displayName" name="displayName" autoComplete="name" required minLength={2} defaultValue={state.fields?.displayName ?? ""} /></Field>
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email ?? ""} /></Field>
      <Field label="Password" htmlFor="password" hint="At least 10 characters. A passphrase works well."><Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} /></Field>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Creating account…" : "Create research account"}</Button>
      <p className="text-center text-xs text-slate-mist">Already registered? <Link href="/sign-in" className="text-gold underline">Sign in</Link></p>
    </form>
  );
}
