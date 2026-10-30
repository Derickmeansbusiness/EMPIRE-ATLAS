import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMedia } from "@/lib/data/fieldbook";

export const dynamic = "force-dynamic";

/** Private image delivery: only the owner can read it; never cacheable by shared caches; never sniffed as another type. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Not found", { status: 404 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const db = await getDb(); const m = await getMedia(db, user.id, id);
  if (!m) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(m.bytes), { headers: { "content-type": m.contentType, "cache-control": "private, no-store", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox", "content-disposition": "inline" } });
}
