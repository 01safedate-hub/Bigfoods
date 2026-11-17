import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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
  title: { default: "FastChina — China’s factories, delivered", template: "%s · FastChina" },
  description: "Shop 1688 factory prices in Naira with free shipping to your Jumia pickup station. Pay small small, group pay and Midnight Drop prices every night.",
  metadataBase: new URL("https://fastchina.shop"),
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="everyday" className={`${inter.variable} ${instrument.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
