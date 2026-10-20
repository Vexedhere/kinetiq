import { NextRequest, NextResponse } from "next/server";

const KINETIQ_CANONICAL_ORIGIN = "https://kinetiq-rzla.vercel.app";
const OTHER_PROJECT_HOSTS = new Set(["try.sparkagent.in.net"]);

/**
 * Keep Kinetiq isolated from aliases belonging to other projects.
 * Preserve the requested path and query while moving visitors to Kinetiq's own origin.
 */
export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();

  if (OTHER_PROJECT_HOSTS.has(host)) {
    const destination = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      KINETIQ_CANONICAL_ORIGIN,
    );
    return NextResponse.redirect(destination, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
