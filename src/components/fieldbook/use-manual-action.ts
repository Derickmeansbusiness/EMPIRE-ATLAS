"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FbState } from "@/app/actions/fieldbook";

/**
 * Runs a server action without React's automatic form reset. React 19 resets uncontrolled fields (dropdowns included)
 * to their defaults when a form action finishes, which wipes what the user chose after a validation error. Here an error
 * leaves the form exactly as typed; success redirects to a fresh page.
 */
export function useManualAction(action: (prev: FbState, data: FormData) => Promise<FbState>) {
  const [state, dispatch, pending] = useActionState<FbState, FormData>(action, {});
  const onSubmit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = new FormData(e.currentTarget); startTransition(() => dispatch(data)); };
  return [state, onSubmit, pending] as const;
}
