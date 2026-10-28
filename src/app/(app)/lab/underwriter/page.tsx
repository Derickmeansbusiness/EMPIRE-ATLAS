import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { PageHeader } from "@/components/ui/primitives";
import { UnderwriterTool } from "@/components/lab/underwriter-tool";

export const metadata: Metadata = { title: "Acquisition Underwriter" };

export default async function UnderwriterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const sp = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Capital Architecture Lab · Hypothetical" title="Acquisition Underwriter" description="Enter assumptions and the model computes income, financing and returns from actual cash flows. Inputs live in the URL so you can share or bookmark a scenario; saving named models arrives in Phase 2." />
      <UnderwriterTool sp={sp} />
    </>
  );
}
