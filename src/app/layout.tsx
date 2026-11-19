import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ServiceWorker } from "@/components/ui/service-worker";
import { BRAND, SHOP_DESCRIPTION, SHOP_URL } from "@/lib/seo";
import "./globals.css";

/** Self-hosted (OFL) so pages never call Google Fonts. */
const inter = localFont({ src: "./fonts/inter-latin-var.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });
const instrument = localFont({
  src: [
    { path: "./fonts/instrument-serif-latin-400-normal.woff2", style: "normal", weight: "400" },
    { path: "./fonts/instrument-serif-latin-400-italic.woff2", style: "italic", weight: "400" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "FastChina — Buy from China in Nigeria, Free Shipping", template: "%s · FastChina" },
  description: SHOP_DESCRIPTION,
  metadataBase: new URL(SHOP_URL),
  applicationName: BRAND,
  keywords: ["buy from China in Nigeria", "China factory prices Nigeria", "import from China to Nigeria", "China wholesale Nigeria", "free shipping Nigeria", "pay small small"],
  alternates: { canonical: "/", languages: { "en-NG": "/" } },
  openGraph: { type: "website", siteName: BRAND, locale: "en_NG", url: "/", title: "FastChina — China’s factories, delivered free in Nigeria", description: SHOP_DESCRIPTION },
  twitter: { card: "summary_large_image", title: "FastChina — China’s factories, delivered free in Nigeria", description: SHOP_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  // Search Console / Bing Webmaster verification: set these in the hosting environment.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  category: "shopping",
  appleWebApp: { capable: true, title: BRAND, statusBarStyle: "black-translucent" },
  icons: { apple: "/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" data-theme="everyday" className={`${inter.variable} ${instrument.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
