import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SignUpForm } from "@/components/site/auth-forms";
import { Alert, Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Begin Research" };

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/command-center");
  const open = (process.env.ATLAS_SIGNUP_MODE ?? "open") === "open";
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
      <div>
        <Eyebrow className="mb-3">Begin research</Eyebrow>
        <h1 className="editorial-h1 text-4xl sm:text-5xl">Open a research account.</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-platinum/75">New accounts start as Students with access to published dossiers, the evidence viewer, private notebooks and the live lab tools. Elevated roles are granted by administrators only.</p>
      </div>
      <div className="card p-6 sm:p-8">{open ? <SignUpForm /> : <Alert tone="warning">Public sign-up is closed. Ask an administrator for an invitation.</Alert>}</div>
    </div>
  );
}
