import type { Metadata, Viewport } from "next";

/** The wholesale market installs as its own app (red icon, scope /wholesale). */
export const metadata: Metadata = {
  manifest: "/pwa/wholesale",
  appleWebApp: { capable: true, title: "Wholesale", statusBarStyle: "default" },
  icons: { apple: "/pwa/wholesale-192.png" },
};
export const viewport: Viewport = { themeColor: "#C8102E" };

export default function WholesaleLayout({ children }: LayoutProps<"/wholesale">) {
  return children;
}
