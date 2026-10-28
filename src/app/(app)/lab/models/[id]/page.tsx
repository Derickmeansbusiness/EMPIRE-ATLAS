import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { getModel, listVersions, MODEL_KIND_LABEL, MODEL_KIND_PATH, type ModelKind } from "@/lib/data/models";
import { Card, Eyebrow, PageHeader } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Model versions" };

export default async function ModelVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = await getDb();
  const model = await getModel(db, user.id, id);
  if (!model) notFound();
  const versions = await listVersions(db, user.id, id);
  const kind = model.modelKind as ModelKind;
  return (
    <>
      <PageHeader eyebrow={`${MODEL_KIND_LABEL[kind]} · Hypothetical`} title={model.name} description={`Version ${model.version} · updated ${formatRelative(model.updatedAt)}`} actions={<Link href={`${MODEL_KIND_PATH[kind]}?model=${model.id}`} className="rounded-md bg-gold px-4 py-2 text-sm text-ink">Open latest</Link>} />
      <div className="space-y-3">
        {versions.map((v) => (
          <Card key={v.id}>
            <div className="flex items-center justify-between"><Eyebrow>Version {v.version}</Eyebrow><span className="text-xs text-slate-mist">{formatRelative(v.createdAt)}</span></div>
            {v.note && <p className="mt-1 text-sm text-platinum/85">{v.note}</p>}
            <pre className="mt-3 overflow-x-auto rounded-md bg-obsidian/70 p-3 text-xs text-platinum/80">{JSON.stringify(v.assumptions, null, 2)}</pre>
            <Link href={`${MODEL_KIND_PATH[kind]}?${new URLSearchParams(Object.entries(v.assumptions as Record<string, unknown>).filter(([, x]) => x != null && typeof x !== "object").map(([k, x]) => [k, String(x)])).toString()}`} className="mt-2 inline-block text-xs text-gold hover:underline">Open this version’s inputs →</Link>
          </Card>
        ))}
      </div>
    </>
  );
}
