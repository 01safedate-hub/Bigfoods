import { type NextRequest, NextResponse } from "next/server";

/**
 * One app, two domains:
 *  - fastchina.shop  → marketplace (app/(shop))
 *  - fastchina.store → dropship & wholesale site (app/store), served at the domain root
 * Seller storefronts on custom domains will route here too once stores are live.
 */
const STORE_HOSTS = (process.env.STORE_HOSTS ?? "fastchina.store,www.fastchina.store").split(",").map((h) => h.trim());

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;

  if (STORE_HOSTS.includes(host) && !pathname.startsWith("/store")) {
    const url = request.nextUrl.clone();
    url.pathname = `/store${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/admin")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|icon.svg|.*\\.[a-z0-9]+$).*)"],
};
