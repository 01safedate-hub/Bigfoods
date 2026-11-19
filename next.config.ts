import type { NextConfig } from "next";

/**
 * Security headers on every response. Scripts and styles allow 'unsafe-inline' because Next.js
 * inlines its bootstrapping; everything else is locked to our own origin and Supabase.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.alicdn.com",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self), payment=(self), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** A year, in seconds. Product photos never change at the same address, so browsers keep them this long. */
const YEAR = 31_536_000;

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // The service worker must never be cached, or updates won't reach phones.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
      // Icons and images in /public: a week in the browser, refreshed quietly after that.
      { source: "/:file([^/]+\\.(?:png|jpg|jpeg|webp|avif|svg|ico))", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }] },
    ];
  },
  images: {
    // Resized product photos are kept for a year by browsers and the CDN (Cache-Control max-age=1 year).
    minimumCacheTTL: YEAR,
    // AVIF first (about 20% smaller than WebP), WebP for older phones.
    formats: ["image/avif", "image/webp"],
    // Sizes we actually render: product cards (~180–260px), product page (~400–720px), full width on phones.
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 180, 256, 384],
    qualities: [60, 75, 85],
    // Product photos: our own storage copies, plus 1688's servers (fetched server-side, so hotlink blocking doesn't apply).
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "**.alicdn.com" },
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
