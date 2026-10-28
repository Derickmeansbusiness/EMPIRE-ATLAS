import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SignInForm } from "@/components/site/auth-forms";
import { Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Sign In" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/command-center");
  const { next } = await searchParams;
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
      <div>
        <Eyebrow className="mb-3">Sign in</Eyebrow>
        <h1 className="editorial-h1 text-4xl sm:text-5xl">Return to your research.</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-platinum/75">Your notes, bookmarks and models are private to your account and will be where you left them.</p>
      </div>
      <div className="card p-6 sm:p-8"><SignInForm next={next} /></div>
    </div>
  );
}
