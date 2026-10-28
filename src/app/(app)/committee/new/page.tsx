import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { listModels } from "@/lib/data/models";
import { Card, PageHeader } from "@/components/ui/primitives";
import { SubmissionForm } from "@/components/committee/submission-form";

export const metadata: Metadata = { title: "New committee submission" };

export default async function NewSubmissionPage() {
  const user = await requireUser();
  const db = await getDb();
  const models = (await listModels(db, user.id)).filter((m) => m.model.modelKind === "underwriter" || m.model.modelKind === "stress").map((m) => ({ id: m.model.id, name: m.model.name, version: m.model.version }));
  return (
    <>
      <PageHeader eyebrow="Investment Committee Chamber" title="Prepare your submission" description="Write as if the committee has not seen the deal. The framework rewards cited evidence, a model that holds up, named risks with mitigations, reconciled sources and uses, a stress test and an exit consistent with your hold period." />
      <Card><SubmissionForm models={models} /></Card>
    </>
  );
}
