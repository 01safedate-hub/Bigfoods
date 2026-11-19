import { Lock, MessageSquare, Plane, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

const TRUST = [
  { icon: Lock, title: "Secure checkout", text: "Card, transfer & USSD via licensed processors. We never store card numbers." },
  { icon: ShieldCheck, title: "Delivered or refunded", text: "Full refund if your order never reaches the pickup station." },
  { icon: Truck, title: "Photo QC in China", text: "See your item before it leaves our warehouse." },
  { icon: Plane, title: "Live tracking", text: "Factory → air or sea → customs → your Jumia station." },
  { icon: MessageSquare, title: "Ask before you buy", text: "Every product has Q&A answered by our team." },
];

export function TrustGrid() {
  return (
    <section aria-label="Why shop with us" className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-5">
      {TRUST.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-center gap-2 rounded-lg bg-surface p-3 last:col-span-2 sm:items-start sm:gap-2.5 sm:p-3.5 lg:last:col-span-1">
          <Icon aria-hidden size={20} strokeWidth={1.7} className="shrink-0 text-success" />
          <span>
            <strong className="block text-[13px]">{title}</strong>
            <span className="hidden text-xs text-muted sm:block">{text}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

export function ShopFooter() {
  return (
    <footer className="mt-10 border-t border-line bg-[#f6f6f6] pb-24 md:pb-0">
      <div className="mx-auto grid max-w-[1360px] grid-cols-2 gap-6 px-4 py-8 text-[13px] md:grid-cols-4 md:px-6">
        <div className="flex flex-col gap-1.5">
          <strong>Help</strong>
          <Link href="/track" className="text-[#444]">Track an order</Link>
          <Link href="/account" className="text-[#444]">Returns &amp; refunds</Link>
          <Link href="/checkout" className="text-[#444]">Pickup stations</Link>
        </div>
        <div className="flex flex-col gap-1.5">
          <strong>Ways to pay</strong>
          <span className="text-[#444]">Pay in full · Pay small small</span>
          <span className="text-[#444]">Group pay links</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <strong>Shipping</strong>
          <span className="text-[#444]">Air: 10+ days, free</span>
          <span className="text-[#444]">Sea (big items): 90+ days</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <strong>Business</strong>
          <Link href="/store" className="text-[#444]">Dropship stores</Link>
          <Link href="/wholesale#sea" className="text-[#444]">Wholesale by sea</Link>
          <Link href="/wholesale" className="text-[#444]">Wholesale market</Link>
          <Link href="/guides" className="text-[#444]">Import &amp; dropshipping guides</Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1360px] flex-wrap justify-between gap-2 border-t border-[#e2e2e2] px-4 pt-3.5 pb-6 text-xs text-muted md:px-6">
        <span>© 2026 FastChina.shop · RC [CAC NUMBER]</span>
        <span className="flex flex-wrap gap-x-3">
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy (NDPA 2023)</Link>
          <Link href="/legal/refunds">Refunds</Link>
          <Link href="/legal/draw-rules">Draw rules</Link>
        </span>
      </div>
    </footer>
  );
}
