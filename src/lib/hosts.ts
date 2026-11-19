/**
 * Which site a request is for, by host name. Mirrors the routing in src/proxy.ts; used by files
 * the proxy never sees (robots.txt, sitemap.xml, llms.txt) so each domain describes itself.
 */
const list = (v: string | undefined, d: string) => (v ?? d).split(",").map((h) => h.trim().toLowerCase());
const STORE_HOSTS = list(process.env.STORE_HOSTS, "fastchina.store,www.fastchina.store");
const MAIN_HOSTS = list(process.env.MAIN_HOSTS, "fastchina.shop,www.fastchina.shop");
const STORE_ROOT = process.env.STORE_ROOT_DOMAIN ?? "fastchina.store";
const isInfra = (h: string) => h === "localhost" || /^[\d.]+$/.test(h) || h.endsWith(".netlify.app") || h.endsWith(".vercel.app") || h.endsWith(".local");

export type Site = { kind: "shop" } | { kind: "store" } | { kind: "seller"; key: string; origin: string };

export function siteFor(hostHeader: string | null): Site {
  const host = (hostHeader ?? "").split(":")[0].toLowerCase();
  if (STORE_HOSTS.includes(host)) return { kind: "store" };
  if (host.endsWith(`.${STORE_ROOT}`)) return { kind: "seller", key: host.slice(0, -STORE_ROOT.length - 1), origin: `https://${host}` };
  if (host && !MAIN_HOSTS.includes(host) && !isInfra(host)) return { kind: "seller", key: host.replace(/^www\./, ""), origin: `https://${host}` };
  return { kind: "shop" };
}
