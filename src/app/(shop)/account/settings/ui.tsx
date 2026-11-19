import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Shared layout for settings screens: back arrow, title, white grouped rows. */
export function SettingsShell({ title, back = "/account/settings", children }: { title: string; back?: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col bg-surface pb-10 md:bg-transparent md:pt-6">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-white px-2 py-2 md:static md:rounded-t-2xl md:border">
        <Link href={back} aria-label="Back" className="flex size-11 items-center justify-center"><ChevronLeft aria-hidden size={24} /></Link>
        <h1 className="text-[19px] font-semibold">{title}</h1>
      </div>
      <div className="flex flex-col gap-2.5 pt-2.5">{children}</div>
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
