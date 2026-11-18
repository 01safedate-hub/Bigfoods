"use client";

import { Check, Globe, Lock } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { SellerDashboard } from "@/lib/data/seller";
import { PLANS, THEMES, type ThemeKey, themeAllowed } from "@/lib/dropship/plans";
import { cn } from "@/lib/format";
import { call } from "@/lib/net";
import { updateStore } from "../actions";
import { btn, Card, CardTitle } from "../_ui/ui";

const ACCENTS = ["#111111", "#C2410C", "#B4235A", "#7C3AED", "#1D4ED8", "#0F766E", "#15803D", "#A16207"];

export function DesignEditor({ store }: { store: SellerDashboard["store"] }) {
  const [f, setF] = useState({ name: store.name, tagline: store.tagline ?? "", accent: store.accent, theme: store.theme, custom_domain: store.custom_domain ?? "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  const plan = PLANS[store.plan];
  const save = (patch: Partial<typeof f>) =>
    start(async () => {
      const r = await call(() => updateStore(patch));
      setMsg({ ok: r.ok, text: r.message });
    });
  const theme = THEMES.find((t) => t.key === f.theme)!;

  return (
    <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-3">
        <Card>
          <CardTitle>Theme</CardTitle>
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {THEMES.map((t) => {
              const ok = themeAllowed(store.plan, t.key);
              return (
                <button key={t.key} type="button" role="radio" aria-checked={f.theme === t.key} disabled={!ok}
                  onClick={() => { setF({ ...f, theme: t.key as ThemeKey }); save({ theme: t.key }); }}
                  className={cn("group relative flex flex-col overflow-hidden rounded-lg border-2 text-left transition-colors", f.theme === t.key ? "border-[#F5C542]" : "border-transparent hover:border-white/20", !ok && "cursor-not-allowed")}>
                  <span className="flex h-20 items-end gap-1 p-2" style={{ background: t.swatch[0] }}>
                    <span className="h-8 w-1/2 rounded" style={{ background: t.swatch[2] }} />
                    <span className="h-12 w-1/3 rounded" style={{ background: t.swatch[2] }} />
                    <span className="absolute left-2 top-2 text-[13px] font-black" style={{ color: t.swatch[1], fontFamily: t.key === "atelier" || t.key === "bloom" ? "var(--font-display)" : undefined }}>Aa</span>
                  </span>
                  <span className="flex items-center justify-between gap-1 bg-[#0E0E10] px-2.5 py-2">
                    <strong className="text-[13px]">{t.name}</strong>
                    {f.theme === t.key ? <Check aria-hidden size={15} className="text-[#F5C542]" /> : !ok ? <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#A1A1AA]"><Lock aria-hidden size={11} />{PLANS[t.plan].name}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[13px] text-[#A1A1AA]">{theme.blurb}</p>
          {store.plan !== "elite" && <Link href="/store/seller/plan" className="mt-2 inline-block text-[13px] font-bold text-[#F5C542]">Unlock {store.plan === "free" ? "Noir, Bloom, Atelier and Pulse" : "Atelier and Pulse"} →</Link>}
        </Card>

        <Card>
          <CardTitle>Name and colour</CardTitle>
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); save({ name: f.name, tagline: f.tagline, accent: f.accent }); }}>
            <label className="flex flex-col gap-1.5 text-[13px] font-bold">Store name
              <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={40} className={btn.input} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-bold">Tagline
              <input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} maxLength={90} className={btn.input} />
            </label>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-[13px] font-bold">Accent colour</legend>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENTS.map((c) => (
                  <button key={c} type="button" aria-label={c} aria-pressed={f.accent === c} onClick={() => setF({ ...f, accent: c })}
                    className={cn("size-9 rounded-full ring-2 ring-offset-2 ring-offset-[#17171A]", f.accent === c ? "ring-white" : "ring-transparent")} style={{ background: c }} />
                ))}
                <label className="flex items-center gap-1.5 text-[12px] text-[#A1A1AA]">
                  <input type="color" value={f.accent} onChange={(e) => setF({ ...f, accent: e.target.value.toUpperCase() })} className="size-9 cursor-pointer rounded-full border-0 bg-transparent" /> Custom
                </label>
              </div>
            </fieldset>
            <button type="submit" disabled={busy} className={cn(btn.primary, "self-start")}>Save</button>
          </form>
        </Card>

        <Card>
          <CardTitle>Your own domain</CardTitle>
          {plan.customDomain ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); save({ custom_domain: f.custom_domain || null as unknown as string }); }}>
              <label className="flex flex-col gap-1.5 text-[13px] font-bold">Domain
                <input value={f.custom_domain} onChange={(e) => setF({ ...f, custom_domain: e.target.value })} placeholder="adascloset.com" className={btn.input} />
              </label>
              <ol className="list-decimal space-y-1 pl-5 text-[13px] text-[#A1A1AA]">
                <li>At your domain provider, add a <strong className="text-white">CNAME</strong> record: <code className="rounded bg-black px-1">www</code> → <code className="rounded bg-black px-1">stores.fastchina.store</code></li>
                <li>Save the domain here. We check it and switch on HTTPS, usually within an hour.</li>
              </ol>
              <span className={cn("flex items-center gap-1.5 text-[13px] font-semibold", store.domain_verified ? "text-[#3DDC84]" : "text-[#A1A1AA]")}>
                <Globe aria-hidden size={14} /> {store.custom_domain ? (store.domain_verified ? `${store.custom_domain} is live` : `Checking ${store.custom_domain}…`) : "Not connected"}
              </span>
              <button type="submit" disabled={busy} className={cn(btn.primary, "self-start")}>Save domain</button>
            </form>
          ) : (
            <p className="text-[14px] text-[#A1A1AA]">Use your own domain, like <strong className="text-white">adascloset.com</strong>, on Pro or Elite. <Link href="/store/seller/plan" className="font-bold text-[#F5C542]">See plans →</Link></p>
          )}
        </Card>
        {msg && <p role="status" className={cn("text-[13px] font-semibold", msg.ok ? "text-[#3DDC84]" : "text-[#FF8A8A]")}>{msg.text}</p>}
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#8A8A93]">Preview</p>
        <div className="overflow-hidden rounded-xl border border-white/10" style={{ background: theme.swatch[0], color: theme.swatch[1] }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${theme.swatch[2]}` }}>
            <strong className={cn("text-[15px]", (f.theme === "atelier" || f.theme === "bloom") && "font-display italic")}>{f.name}</strong>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white" style={{ background: f.accent }}>Cart</span>
          </div>
          <div className="px-4 py-6">
            <p className={cn("text-[22px] font-black leading-tight", (f.theme === "atelier" || f.theme === "bloom") && "font-display font-normal italic")}>{f.tagline || "Your tagline here"}</p>
            <span className="mt-3 inline-block rounded-full px-4 py-2 text-[12px] font-bold text-white" style={{ background: f.accent }}>Shop now</span>
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            {[0, 1, 2].map((i) => <span key={i} className="aspect-[3/4] rounded" style={{ background: theme.swatch[2] }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
