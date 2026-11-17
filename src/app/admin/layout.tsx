import type { Metadata } from "next";
import { Suspense } from "react";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { AdminNav } from "./admin-nav";
import { StaffGate } from "./staff-gate";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · FastChina admin" }, robots: { index: false, follow: false } };

/** Admin shell. Every page goes through StaffGate (Supabase Auth + staff role); the database enforces the same with RLS. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F5F7] text-[13px] lg:flex-row">
      <aside className="flex flex-col gap-4 bg-[#0F1115] p-3.5 text-[#D7DAE0] lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:py-5">
        <div className="flex items-baseline gap-0.5 text-white">
          <span className="text-lg font-extrabold tracking-[0.06em]">FASTCHINA</span>
          <span className="text-[11px] font-bold text-gold">admin</span>
        </div>
        <AdminNav />
      </aside>
      <OfflineBanner />
      <main id="main" className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
        <Suspense fallback={<p className="text-[#5B6170]">Checking access…</p>}>
          <StaffGate>{children}</StaffGate>
        </Suspense>
      </main>
    </div>
  );
}
