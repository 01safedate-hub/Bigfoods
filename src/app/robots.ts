import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/cart", "/account", "/track", "/sign-in", "/c/", "/wishlist"] }],
    sitemap: "https://fastchina.shop/sitemap.xml",
  };
}
