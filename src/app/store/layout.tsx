import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "FastChina.store — Launch your own store, import by sea", template: "%s · FastChina.store" },
  description: "Open a dropshipping store with your own domain, or ship wholesale goods from your own China address by sea.",
};

export default function StoreLayout({ children }: LayoutProps<"/store">) {
  return <div className="bg-[#FBFAF6] text-ink">{children}</div>;
}
