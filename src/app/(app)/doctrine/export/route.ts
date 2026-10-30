import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDoctrine, exportPrinciples } from "@/lib/data/study";
import { recordProgress } from "@/lib/data/workspace";
import { doctrineHtml, doctrineMarkdown, DOCTRINE_FIELDS } from "@/lib/doctrine";
import { researcherLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in?next=/doctrine", req.url));
  const db = await getDb();
  const [d, principles] = await Promise.all([getDoctrine(db, user.id), exportPrinciples(db, user.id)]);
  const doctrine = Object.fromEntries(DOCTRINE_FIELDS.map((f) => [f.key, (d?.[f.key as keyof typeof d] as string | null | undefined) ?? ""]));
  const input = { author: user.displayName, researcherLabel: researcherLabel(user.researcherNumber), date: new Date().toISOString().slice(0, 10), doctrine, principles };
  await recordProgress(db, user.id, "doctrine.exported");
  const format = req.nextUrl.searchParams.get("format") === "md" ? "md" : "html";
  const headers: Record<string, string> = { "cache-control": "no-store", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" };
  if (format === "md") return new NextResponse(doctrineMarkdown(input), { headers: { ...headers, "content-type": "text/markdown; charset=utf-8", "content-disposition": 'attachment; filename="investment-doctrine.md"' } });
  return new NextResponse(doctrineHtml(input), { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
}
