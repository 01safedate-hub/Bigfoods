import type { Metadata } from "next";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · FastChina admin" }, robots: { index: false, follow: false } };

/** Admin shell. Access will be enforced with Supabase Auth + role checks (RLS) when the backend is connected. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F5F7] text-[13px] lg:flex-row">
      <aside className="flex flex-col gap-4 bg-[#0F1115] p-3.5 text-[#D7DAE0] lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:py-5">
        <div className="flex items-baseline gap-0.5 text-white">
          <span className="text-lg font-extrabold tracking-[0.06em]">FASTCHINA</span>
          <span className="text-[11px] font-bold text-gold">admin</span>
        </div>
        <AdminNav />
        <div className="mt-auto hidden flex-col gap-1.5 rounded-lg bg-[#1A1D24] p-3 lg:flex">
          <strong className="text-white">Ada Okafor</strong>
          <span className="text-xs">Role: <strong className="text-gold">Purchasing officer</strong></span>
          <span className="text-xs leading-relaxed text-[#A0A6B1]">Can view orders, purchasing, arrivals and dispatch. Pricing rules need Super admin or Finance.</span>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
    </div>
  );
}
