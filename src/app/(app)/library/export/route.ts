import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { exportNotesMarkdown } from "@/lib/data/study";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in?next=/library", req.url));
  const db = await getDb();
  const md = await exportNotesMarkdown(db, user.id, user.displayName);
  return new NextResponse(md, { headers: { "content-type": "text/markdown; charset=utf-8", "content-disposition": 'attachment; filename="empire-atlas-notes.md"', "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
