"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { slugify } from "@/lib/dropship/plans";
import { call } from "@/lib/net";
import { checkSlug, createStore } from "../actions";
import { btn } from "./ui";

/** Open a store in one screen: name → address (checked live) → tagline. Starts on the Free plan. */
export function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [tagline, setTagline] = useState("");
  const [avail, setAvail] = useState<{ ok: boolean; message: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const address = touched ? slug : slugify(name);

  useEffect(() => {
    if (address.length < 3) return;
    let live = true;
    const t = setTimeout(() => checkSlug(address).then((r) => live && setAvail(r)).catch(() => {}), 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [address]);
  const shownAvail = address.length >= 3 ? avail : null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-5 py-14">
      <div>
        <p className="text-[13px] font-bold uppercase tracking-widest text-[#F5C542]">Free to start</p>
        <h1 className="mt-1 text-[34px] font-black leading-[1.05] tracking-tight">Open your store in a minute.</h1>
        <p className="mt-2 text-[#A1A1AA]">Pick products from FastChina, set your price, share your link. We buy, ship and deliver to your customer’s pickup station. You get paid every Friday.</p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await call(() => createStore({ name, slug: address, tagline }));
            if (!r.ok) return setMsg(r.message);
            router.refresh();
          });
        }}
      >
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Store name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ada’s Closet" className={btn.input} autoFocus />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Store address
          <span className="flex items-center overflow-hidden rounded-md border border-white/10 bg-[#0E0E10] focus-within:border-[#F5C542]">
            <input value={address} onChange={(e) => { setTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }} maxLength={30}
              className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] focus:outline-none" aria-describedby="slug-status" />
            <span className="pr-3 text-[14px] text-[#6B6B73]">.fastchina.store</span>
          </span>
          <span id="slug-status" aria-live="polite" className={`flex items-center gap-1 text-[12px] font-semibold ${shownAvail?.ok ? "text-[#3DDC84]" : "text-[#FF8A8A]"}`}>
            {shownAvail && (shownAvail.ok ? <Check aria-hidden size={13} /> : <X aria-hidden size={13} />)} {shownAvail?.message}
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          One line about your store <span className="font-normal text-[#6B6B73]">optional</span>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={90} placeholder="Lagos girls, Lagos prices." className={btn.input} />
        </label>
        {msg && <p role="alert" className="text-[13px] font-semibold text-[#FF8A8A]">{msg}</p>}
        <button type="submit" disabled={busy || name.trim().length < 2 || !shownAvail?.ok} className={btn.primary}>
          {busy ? <Loader2 aria-hidden size={18} className="animate-spin" /> : null} Open my store
        </button>
        <p className="text-center text-[12px] text-[#6B6B73]">Free plan: 20 products and up to ₦2,000,000 in sales. Upgrade any time.</p>
      </form>
    </div>
  );
}
