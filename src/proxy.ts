import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * One app, two domains:
 *  - fastchina.shop  → marketplace (app/(shop))
 *  - fastchina.store → dropship & wholesale site (app/store), served at the domain root
 * Seller storefronts on custom domains will route here too once stores are live.
 */
const STORE_HOSTS = (process.env.STORE_HOSTS ?? "fastchina.store,www.fastchina.store").split(",").map((h) => h.trim());

/** Keeps the Supabase sign-in fresh: refreshes the session cookie when it is close to expiring. */
async function withSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return response;
  const db = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });
  await db.auth.getUser();
  return response;
}

export async function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;

  if (STORE_HOSTS.includes(host) && !pathname.startsWith("/store")) {
    const url = request.nextUrl.clone();
    url.pathname = `/store${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  const res = NextResponse.next({ request });
  if (pathname.startsWith("/admin")) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return withSession(request, res);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|icon.svg|.*\\.[a-z0-9]+$).*)"],
};
