import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addMedia, MAX_IMAGE_BYTES } from "@/lib/data/fieldbook";

export const dynamic = "force-dynamic";

/** Photo upload for an inspection. Authenticated, same-origin only, size-limited, type checked by magic bytes. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload photos." }, { status: 401 });
  // Defence in depth (the session cookie is SameSite=Lax, which already withholds it from cross-site POSTs): compare the
  // browser's Origin with the host the request was actually addressed to, which is correct behind proxies too.
  const origin = req.headers.get("origin"); const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin) { let originHost = ""; try { originHost = new URL(origin).host; } catch { /* malformed */ } if (!host || originHost !== host) return NextResponse.json({ error: "Cross-site uploads are not allowed." }, { status: 403 }); }
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_IMAGE_BYTES + 200_000) return NextResponse.json({ error: "Photos are limited to 3 MB." }, { status: 413 });
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Could not read the upload." }, { status: 400 }); }
  const file = form.get("photo");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  if (form.get("consent") !== "1") return NextResponse.json({ error: "Confirm you have permission to photograph this area." }, { status: 400 });
  const sessionId = String(form.get("sessionId") ?? ""); const findingId = String(form.get("findingId") ?? "") || null;
  const caption = String(form.get("caption") ?? "").trim().slice(0, 200) || null;
  const db = await getDb();
  const res = await addMedia(db, user.id, sessionId, findingId, new Uint8Array(await file.arrayBuffer()), caption);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  const back = String(form.get("returnTo") ?? "");
  if (form.get("redirect") === "1" && back.startsWith("/fieldbook/") && !back.startsWith("//")) return new NextResponse(null, { status: 303, headers: { location: back } }); // relative: resolved against the host the browser used, so its cookie goes with it
  return NextResponse.json({ id: res.id });
}
