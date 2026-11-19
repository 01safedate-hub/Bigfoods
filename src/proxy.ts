import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * One app, several kinds of address:
 *  - fastchina.shop            → marketplace (app/(shop))
 *  - fastchina.store           → dropship site (/) and the seller dashboard (/seller) (app/store)
 *  - fastchina.store/<name>    → a seller's storefront, by store name or staff-set alias (app/s/[store])
 *  - name.fastchina.store      → the same storefront, once wildcard DNS is set up
 *  - /store/<name> on the marketplace or preview hosts → the storefront too (handy for testing)
 *  - a seller's own domain     → their storefront too (looked up by verified domain)
 */
const STORE_HOSTS = (process.env.STORE_HOSTS ?? "fastchina.store,www.fastchina.store").split(",").map((h) => h.trim());
const MAIN_HOSTS = (process.env.MAIN_HOSTS ?? "fastchina.shop,www.fastchina.shop").split(",").map((h) => h.trim());
const STORE_ROOT = process.env.STORE_ROOT_DOMAIN ?? "fastchina.store";
/** Pages that work the same on every domain (sign-in, legal, APIs, app files). */
const SHARED = /^\/(sign-in|api|legal|track|offline|unsubscribe|notifications|pwa|manifest\.webmanifest|sw\.js|robots\.txt|sitemap\.xml)(\/|$)/;
/** Pages of the dropship site itself; any other first path segment on fastchina.store is a store name. */
const STORE_PAGES = new Set(["", "seller", "opengraph-image", "store", "pwa", "admin", "api"]);
const NAME = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
/** Development and preview hosts are never treated as a seller's own domain. */
const isInfraHost = (h: string) => h === "localhost" || /^[\d.]+$/.test(h) || h.endsWith(".netlify.app") || h.endsWith(".vercel.app") || h.endsWith(".local");

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

  const rewrite = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    return withSession(request, NextResponse.rewrite(url, { request }));
  };

  if (!SHARED.test(pathname) && !pathname.startsWith("/s/")) {
    // fastchina.store itself: the dropship site and seller dashboard, or fastchina.store/<store name>.
    if (STORE_HOSTS.includes(host)) {
      const [, first = "", ...rest] = pathname.split("/");
      if (!STORE_PAGES.has(first) && NAME.test(first)) return rewrite(`/s/${first}${rest.length ? `/${rest.join("/")}` : ""}`);
      if (!pathname.startsWith("/store")) return rewrite(`/store${pathname === "/" ? "" : pathname}`);
    }
    // name.fastchina.store: a seller's storefront.
    if (host.endsWith(`.${STORE_ROOT}`) && !STORE_HOSTS.includes(host)) {
      return rewrite(`/s/${host.slice(0, -STORE_ROOT.length - 1)}${pathname === "/" ? "" : pathname}`);
    }
    // Anything else that isn't ours or a preview host: a seller's own domain.
    if (host && !MAIN_HOSTS.includes(host) && !STORE_HOSTS.includes(host) && !isInfraHost(host)) {
      return rewrite(`/s/${host.replace(/^www\./, "")}${pathname === "/" ? "" : pathname}`);
    }
  }

  // Marketplace and preview hosts: /store/<name> opens that seller's storefront.
  const m = /^\/store\/([a-z0-9-]+)(\/.*)?$/.exec(pathname);
  if (m && !STORE_HOSTS.includes(host) && !STORE_PAGES.has(m[1]) && NAME.test(m[1])) return rewrite(`/s/${m[1]}${m[2] ?? ""}`);

  const res = NextResponse.next({ request });
  if (pathname.startsWith("/admin")) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return withSession(request, res);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|icon.svg|.*\\.[a-z0-9]+$).*)"],
};
