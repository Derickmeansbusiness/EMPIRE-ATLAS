import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getReport } from "@/lib/data/fieldbook";
import { reportHtml, type ReportSnapshot } from "@/fieldbook/report";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 307, headers: { location: "/sign-in?next=/fieldbook" } });
  const { id } = await params; if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const db = await getDb(); const r = await getReport(db, user.id, id); if (!r) return new NextResponse("Not found", { status: 404 });
  const headers: Record<string, string> = { "cache-control": "private, no-store", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" };
  if (req.nextUrl.searchParams.get("format") === "md") return new NextResponse(r.markdown, { headers: { ...headers, "content-type": "text/markdown; charset=utf-8", "content-disposition": 'attachment; filename="property-intelligence-report.md"' } });
  return new NextResponse(reportHtml(r.snapshot as unknown as ReportSnapshot), { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
}
