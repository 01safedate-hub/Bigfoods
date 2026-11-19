import { siteFor } from "@/lib/hosts";
import { getStore } from "@/lib/data/stores";

/**
 * Separate installable apps (PWAs), each with its own name, icon, colours and scope:
 *  - shop       fastchina.shop (app/manifest.ts)
 *  - wholesale  the wholesale market
 *  - store      fastchina.store, the dropship site
 *  - seller     the seller dashboard
 *  - admin      staff admin
 *  - storefront a seller's own store (?s=<name>), named and coloured after the store
 * Served at /pwa/<app> on every host; start URLs follow the host (fastchina.store serves /seller, not /store/seller).
 */
type Manifest = Record<string, unknown>;

const icons = (name: string) => [
  { src: `/pwa/${name}-192.png`, sizes: "192x192", type: "image/png" },
  { src: `/pwa/${name}-512.png`, sizes: "512x512", type: "image/png" },
  { src: `/pwa/${name}-maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
];

export async function GET(request: Request, { params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  const onStoreHost = siteFor(request.headers.get("host")).kind === "store";
  const storePath = (p: string) => (onStoreHost ? p || "/" : `/store${p}`);
  let m: Manifest | null = null;

  if (app === "wholesale") {
    m = {
      id: "/wholesale?app=wholesale", name: "FastChina Wholesale", short_name: "Wholesale",
      description: "Factory stock by sea for your shop, from 10 units per product.",
      start_url: "/wholesale?source=pwa", scope: "/wholesale", display: "standalone", background_color: "#ffffff", theme_color: "#C8102E",
      categories: ["shopping", "business"], icons: icons("wholesale"),
      shortcuts: [{ name: "Wholesale cart", url: "/wholesale/cart" }],
    };
  } else if (app === "store") {
    m = {
      id: `${storePath("")}?app=store`, name: "FastChina.store", short_name: "FastChina.store",
      description: "Start a dropshipping store in Nigeria for free.",
      start_url: `${storePath("")}?source=pwa`, scope: storePath(""), display: "standalone", background_color: "#FBFAF6", theme_color: "#14120D",
      categories: ["business", "shopping"], icons: icons("store"),
      shortcuts: [{ name: "Seller dashboard", url: storePath("/seller") }],
    };
  } else if (app === "seller") {
    m = {
      id: `${storePath("/seller")}?app=seller`, name: "FastChina Seller", short_name: "Seller",
      description: "Your dropship store: products, orders, earnings.",
      start_url: `${storePath("/seller")}?source=pwa`, scope: storePath("/seller"), display: "standalone", background_color: "#000000", theme_color: "#000000",
      categories: ["business", "productivity"], icons: icons("seller"),
      shortcuts: [
        { name: "Orders", url: storePath("/seller/orders") },
        { name: "Products", url: storePath("/seller/products") },
        { name: "Earnings", url: storePath("/seller/earnings") },
      ],
    };
  } else if (app === "admin") {
    m = {
      id: "/admin?app=admin", name: "FastChina Admin", short_name: "FC Admin",
      start_url: "/admin?source=pwa", scope: "/admin", display: "standalone", background_color: "#0F1115", theme_color: "#0F1115",
      categories: ["business", "productivity"], icons: icons("admin"),
      shortcuts: [{ name: "Orders", url: "/admin/orders" }, { name: "Wholesale", url: "/admin/wholesale" }, { name: "Purchasing", url: "/admin/purchasing" }],
    };
  } else if (app === "storefront") {
    const key = new URL(request.url).searchParams.get("s") ?? "";
    const found = /^[a-z0-9.-]{3,80}$/.test(key) ? await getStore(key) : null;
    if (found) {
      const s = found.store;
      const base = `/s/${s.slug}`;
      const icon = (size: number, purpose?: string) => ({ src: `/pwa/icon?s=${encodeURIComponent(s.slug)}&size=${size}${purpose ? "&maskable=1" : ""}`, sizes: `${size}x${size}`, type: "image/png", ...(purpose ? { purpose } : {}) });
      m = {
        id: `${base}?app=storefront`, name: s.name, short_name: s.name.slice(0, 12),
        description: s.tagline ?? `${s.name}: shop online, delivered to your Jumia pickup station.`,
        start_url: `${base}?source=pwa`, scope: `${base}/`, display: "standalone", background_color: "#ffffff", theme_color: s.accent,
        categories: ["shopping"], icons: [icon(192), icon(512), icon(512, "maskable")],
        shortcuts: [{ name: "My bag", url: `${base}/bag` }],
      };
    }
  }

  if (!m) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(m), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
