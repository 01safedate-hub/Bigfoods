import { siteFor } from "@/lib/hosts";
import { SHOP_URL, STORE_URL } from "@/lib/seo";

/** Each domain gets its own robots.txt and points to its own sitemap. */
export function GET(request: Request) {
  const site = siteFor(request.headers.get("host"));
  const lines: string[] = ["User-agent: *", "Allow: /"];
  let sitemap: string;
  if (site.kind === "shop") {
    lines.push(...["/admin", "/checkout", "/cart", "/account", "/track", "/sign-in", "/c/", "/wishlist", "/notifications", "/unsubscribe", "/api/", "/offline", "/search?"].map((p) => `Disallow: ${p}`));
    sitemap = `${SHOP_URL}/sitemap.xml`;
  } else if (site.kind === "store") {
    lines.push("Disallow: /seller", "Disallow: /sign-in", "Disallow: /api/");
    sitemap = `${STORE_URL}/sitemap.xml`;
  } else {
    lines.push("Disallow: /bag", "Disallow: /api/");
    sitemap = `${site.origin}/sitemap.xml`;
  }
  const body = `${lines.join("\n")}\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
