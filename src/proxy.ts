import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge proxy: forwards the request path to server components (for post-sign-in redirects and
 * active navigation) and redirects anonymous visitors away from private routes early.
 * Authorization is still enforced server-side in layouts and actions; this is a UX shortcut only.
 */
const PRIVATE_PREFIXES = ["/command-center", "/dossiers", "/timeline", "/deals", "/evidence", "/network", "/lab", "/library", "/profile", "/admin", "/roadmap", "/institutions", "/simulator", "/committee", "/synthesis", "/doctrine", "/ritual", "/program", "/quizzes", "/historian", "/fieldbook"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const headers = new Headers(request.headers);
  headers.set("x-atlas-path", pathname + search);
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPrivate && !request.cookies.get("atlas_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"] };
