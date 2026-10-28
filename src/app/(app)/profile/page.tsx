import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatRelative, researcherLabel } from "@/lib/format";
import { signOutAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Profile & Settings" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader eyebrow="Profile & Settings" title={user.displayName} description={researcherLabel(user.researcherNumber) ?? undefined} />
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <Eyebrow className="mb-2">Account</Eyebrow>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-mist">Email</dt><dd>{user.email}</dd></div>
            <div><dt className="text-slate-mist">Role</dt><dd>{ROLE_LABELS[user.role]}</dd></div>
            <div><dt className="text-slate-mist">Member since</dt><dd>{formatRelative(user.createdAt)}</dd></div>
            <div><dt className="text-slate-mist">Last sign-in</dt><dd>{formatRelative(user.lastSignInAt)}</dd></div>
          </dl>
          <form action={signOutAction} className="mt-5"><button type="submit" className="rounded-md border border-risk/50 px-4 py-2 text-sm text-risk hover:bg-risk/10 focus-ring">Sign out</button></form>
        </Card>
        <Card>
          <Eyebrow className="mb-2">Competency level</Eyebrow>
          <p className="font-serif text-2xl">Research Apprentice</p>
          <p className="mt-2 text-xs text-slate-mist">Progression (Deal Analyst, Credit Architect, Acquisition Strategist, Capital Strategist, Empire Architect) will be driven by completed exercises and verified skills once quizzes and simulations ship. Time spent viewing content does not count.</p>
        </Card>
      </div>
    </>
  );
}
