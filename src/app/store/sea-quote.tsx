"use client";

import { useState } from "react";
import { naira } from "@/lib/format";
import { PRICING } from "@/lib/pricing/config";

const HANDLING = 35_000;

/** `cta`: where the button goes. Without it the button is the wholesale application on fastchina.store. */
export function SeaQuote({ cta }: { cta?: { label: string; href: string } } = {}) {
  const [cbm, setCbm] = useState(2);
  const freight = cbm * PRICING.seaPerCbm;
  const set = (v: number) => setCbm(Math.max(0.5, Math.round(v * 2) / 2));
  return (
    <form className="flex flex-col gap-5 self-start rounded-[28px] bg-[#FBFAF6] p-6 text-ink md:p-8" onSubmit={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[28px] leading-none sm:text-[32px]">Sea freight estimate</h3>
        <span className="rounded-full bg-[#E9EFEA] px-2.5 py-1.5 text-xs font-semibold text-[#0F5C45]">90+ days</span>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#4A4740]">
          From
          <select className="min-h-12 rounded-xl border border-[#D8D2C3] bg-white px-3 text-[15px] font-normal text-ink"><option>Guangzhou</option><option>Yiwu</option><option>Shenzhen</option></select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#4A4740]">
          To
          <select className="min-h-12 rounded-xl border border-[#D8D2C3] bg-white px-3 text-[15px] font-normal text-ink"><option>Lagos (Apapa)</option><option>Lagos (Tin Can)</option><option>Onne, Port Harcourt</option></select>
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="cbm" className="text-[13px] font-semibold text-[#4A4740]">Volume (CBM)</label>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Decrease volume" onClick={() => set(cbm - 0.5)} className="size-12 rounded-xl border border-[#D8D2C3] bg-white text-2xl">−</button>
          <input id="cbm" type="number" min={0.5} step={0.5} value={cbm} onChange={(e) => set(Number(e.target.value) || 0.5)} className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#D8D2C3] bg-white text-center text-xl font-bold" />
          <button type="button" aria-label="Increase volume" onClick={() => set(cbm + 0.5)} className="size-12 rounded-xl border border-[#D8D2C3] bg-white text-2xl">+</button>
        </div>
        <span className="text-[13px] text-[#6B675D]">Minimum 0.5 CBM. A 20ft container holds about 28 CBM.</span>
      </div>
      <dl className="flex flex-col gap-2.5 border-t border-dashed border-[#D8D2C3] pt-4 text-[15px]">
        <div className="flex justify-between"><dt className="text-[#4A4740]">Freight ({cbm} CBM × {naira(PRICING.seaPerCbm)})</dt><dd className="font-semibold">{naira(freight)}</dd></div>
        <div className="flex justify-between"><dt className="text-[#4A4740]">Clearing &amp; handling</dt><dd className="font-semibold">{naira(HANDLING)}</dd></div>
        <div className="flex items-baseline justify-between pt-2"><dt className="font-semibold">Estimated total</dt><dd className="font-display text-[40px] leading-none">{naira(freight + HANDLING)}</dd></div>
      </dl>
      <span className="text-xs text-[#6B675D]">Sample rates. The final price is confirmed after your cargo is measured at our warehouse.</span>
      {cta ? (
        <a href={cta.href} className="flex min-h-[52px] items-center justify-center rounded-[14px] bg-ink text-base font-semibold text-white">{cta.label}</a>
      ) : (
        <button type="submit" className="min-h-[52px] rounded-[14px] bg-ink text-base font-semibold text-white">Apply for a wholesale account</button>
      )}
    </form>
  );
}
