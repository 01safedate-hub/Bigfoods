import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export const ngn = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
export const ngnShort = (n: number) => (n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M` : n >= 10_000 ? `₦${Math.round(n / 1_000)}k` : ngn(n));

export function Page({ title, subtitle, action, children }: { title: string; subtitle?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] font-black leading-tight tracking-tight md:text-[34px]">{title}</h1>
          {subtitle && <p className="mt-1 text-[14px] text-[#A1A1AA]">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={cn("min-w-0 rounded-xl bg-[#17171A] p-4 md:p-5", className)}>{children}</section>
);

export const CardTitle = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-3 flex items-center justify-between gap-2">
    <h2 className="text-[17px] font-extrabold tracking-tight">{children}</h2>
    {action}
  </div>
);

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "gold" | "green" }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-[#17171A] p-4">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A93]">{label}</span>
      <strong className={cn("text-[26px] font-black tabular-nums tracking-tight", tone === "gold" && "text-[#F5C542]", tone === "green" && "text-[#3DDC84]")}>{value}</strong>
      {sub && <span className="text-[12px] text-[#A1A1AA]">{sub}</span>}
    </div>
  );
}

const STATUS: Record<string, [string, string]> = {
  awaiting_payment: ["Waiting for payment", "bg-[#2A2A30] text-[#A1A1AA]"], part_paid: ["Part paid", "bg-[#2A2A30] text-[#A1A1AA]"],
  paid: ["Paid", "bg-[#13361F] text-[#3DDC84]"], purchasing: ["Buying", "bg-[#2B2410] text-[#F5C542]"], purchased: ["Bought", "bg-[#2B2410] text-[#F5C542]"],
  at_warehouse: ["Warehouse", "bg-[#2B2410] text-[#F5C542]"], shipped: ["On the way", "bg-[#11263F] text-[#7CC4FF]"], delivered: ["Delivered", "bg-[#13361F] text-[#3DDC84]"],
  cancelled: ["Cancelled", "bg-[#3A1416] text-[#FF8A8A]"], refunded: ["Refunded", "bg-[#3A1416] text-[#FF8A8A]"],
};
export const StatusPill = ({ status }: { status: string }) => {
  const [label, cls] = STATUS[status] ?? [status, "bg-[#2A2A30]"];
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", cls)}>{label}</span>;
};

export function Meter({ value, max, label, tone = "gold" }: { value: number; max: number; label: string; tone?: "gold" | "red" }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2 overflow-hidden rounded-full bg-[#2A2A30]">
      <div className={cn("h-full rounded-full", tone === "red" ? "bg-[#FF5C5C]" : "bg-[#F5C542]")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export const btn = {
  primary: "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#F5C542] px-5 text-[14px] font-extrabold text-black transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100",
  ghost: "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 px-5 text-[14px] font-bold text-white transition-colors hover:border-white disabled:opacity-40",
  input: "min-h-11 w-full rounded-md border border-white/10 bg-[#0E0E10] px-3 text-[15px] text-white placeholder:text-[#6B6B73] focus:border-[#F5C542] focus:outline-none",
};
