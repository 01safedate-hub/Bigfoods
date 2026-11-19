import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const SIDE: [string, string][] = [
  ["/account", "Me"], ["/account/orders", "My orders"], ["/account/wallet", "Wallet"], ["/account/settings/station", "Pickup station"],
  ["/account/settings/payments", "Payment options"], ["/account/settings/profile", "Manage my account"], ["/notifications", "Notifications"],
  ["/account/settings/feedback", "Rating & feedback"], ["/account/settings/contact", "Connect to us"], ["/account/settings/cookies", "Manage cookies"], ["/account/settings", "All settings"],
];

/** Shared layout for account screens: back arrow and title on phones; a side menu beside the content on desktop. */
export function SettingsShell({ title, back = "/account/settings", children }: { title: string; back?: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col bg-surface pb-10 md:bg-transparent md:pt-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8">
      <nav aria-label="Account" className="sticky top-28 hidden flex-col gap-0.5 lg:flex">
        {SIDE.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-lg px-3 py-2.5 text-[14px] hover:bg-surface">{label}</Link>
        ))}
      </nav>
      <div className="flex min-w-0 flex-col lg:max-w-3xl">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-white px-2 py-2 md:static md:rounded-t-2xl md:border lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0">
          <Link href={back} aria-label="Back" className="flex size-11 items-center justify-center lg:hidden"><ChevronLeft aria-hidden size={24} /></Link>
          <h1 className="text-[19px] font-semibold lg:text-[26px] lg:font-extrabold">{title}</h1>
        </div>
        <div className="flex flex-col gap-2.5 pt-2.5">{children}</div>
      </div>
    </div>
  );
}

export function Group({ children }: { children: ReactNode }) {
  return <div className="flex flex-col divide-y divide-line bg-white md:rounded-2xl md:border md:border-line">{children}</div>;
}

export function Row({ href, label, value, external }: { href: string; label: ReactNode; value?: ReactNode; external?: boolean }) {
  const inner = (
    <>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {value !== undefined && <span className="max-w-[45%] truncate text-[14px] text-muted">{value}</span>}
      <ChevronRight aria-hidden size={18} className="shrink-0 text-subtle" />
    </>
  );
  const cls = "flex min-h-14 items-center gap-3 px-4 text-[15px] font-light hover:bg-surface";
  return external ? <a href={href} className={cls}>{inner}</a> : <Link href={href} className={cls}>{inner}</Link>;
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 bg-white p-4 md:rounded-2xl md:border md:border-line">{children}</div>;
}
