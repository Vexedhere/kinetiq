import { NextRequest, NextResponse } from "next/server";

const KINETIQ_CANONICAL_ORIGIN = "https://kinetiq-rzla.vercel.app";
const KINETIQ_CANONICAL_HOST = "kinetiq-rzla.vercel.app";
const OTHER_PROJECT_HOSTS = new Set(["try.sparkagent.in.net"]);

/**
 * The SparkAgent hostname must never be treated as Kinetiq's home.
 * Use a temporary, non-cacheable redirect so an old permanent redirect cannot
 * be reinforced by this middleware. Canonical-host routing is managed in Vercel.
 */
export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();

  if (OTHER_PROJECT_HOSTS.has(host)) {
    const destination = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      KINETIQ_CANONICAL_ORIGIN,
    );
    const response = NextResponse.redirect(destination, 307);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("X-Kinetiq-Canonical-Host", KINETIQ_CANONICAL_HOST);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("X-Kinetiq-Canonical-Host", KINETIQ_CANONICAL_HOST);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
