import { BadgeCheck, Camera, Factory, Headphones, Lock, PackageCheck, Percent, RotateCcw, ShieldCheck, Tag, Truck, UserLock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbs, graph, organization } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Why choose FastChina: order guarantee, security & privacy",
  description: "Free shipping to Jumia pickup stations, delivered-or-refunded, photo checks in China, 7-day returns on wrong or damaged items, secure payments and NDPA privacy.",
  alternates: { canonical: "/why-fastchina" },
};

const GUARANTEE = [
  [Truck, "Free shipping on every order", "Air freight, customs clearing and delivery to your Jumia pickup station are inside the price. Air orders usually arrive in 10–18 days; big items go by sea in 90+ days."],
  [PackageCheck, "Delivered or refunded", "If your order never reaches your pickup station, you get every naira back: instantly to your wallet, or to your card or bank."],
  [Camera, "Photo check in China", "Each order is checked and photographed at our China warehouse before it ships, so you see your exact item first."],
  [RotateCcw, "Wrong or damaged? 7-day returns", "Report it within 7 days of collection with a photo and choose a full refund or a replacement. Drop it at your pickup station for free."],
  [Tag, "Your price is locked", "The price at checkout is final, including on Pay small small, even if the naira moves."],
  [Headphones, "Real people answer", "Ask about any product before you buy, and reach us by email or WhatsApp after. Every product question is answered by our team."],
] as const;

const SECURITY = [
  [Lock, "Pay safely", ["Card payments are handled by a licensed payment processor that meets the Payment Card Industry Data Security Standard (PCI DSS).", "We never see or store your card number.", "Every page is encrypted (HTTPS) end to end.", "Pay by card, bank transfer, USSD or your FastChina wallet, always in Naira."]],
  [UserLock, "Your data stays private", ["We follow the Nigeria Data Protection Act 2023.", "No advertising or tracking cookies.", "Your phone number is used only for order updates and pickup codes, and never shared with sellers.", "Download or delete your data any time from Settings."]],
] as const;

export default function WhyPage() {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 md:px-0 md:py-10 lg:grid lg:grid-cols-2 lg:gap-x-12 lg:gap-y-8">
      <JsonLd data={graph(organization(), breadcrumbs([["Home", "/"], ["Why FastChina", "/why-fastchina"]]))} />
      <header className="flex flex-col items-center gap-3 text-center lg:col-span-2 lg:flex-row lg:items-center lg:gap-5 lg:text-left">
        <ShieldCheck aria-hidden size={56} strokeWidth={1.4} className="text-success" />
        <h1 className="text-[28px] font-extrabold leading-tight md:text-[38px]">Why choose FastChina</h1>
        <p className="max-w-xl text-[15px] text-muted">China’s factory prices, with the protections you’d expect from a shop down the road.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:col-span-2">
        <div className="flex gap-3 rounded-2xl bg-surface p-4">
          <Percent aria-hidden size={22} className="mt-0.5 shrink-0 text-success" />
          <span className="flex flex-col gap-1"><strong>How are prices so low?</strong><span className="text-[14px] leading-relaxed text-muted">We buy straight from Chinese factories and wholesalers at the prices they charge local shops, and skip the layers of importers and resellers. Our profit is on the goods only; freight and clearing pass through at cost.</span></span>
        </div>
        <div className="flex gap-3 rounded-2xl bg-surface p-4">
          <Factory aria-hidden size={22} className="mt-0.5 shrink-0 text-success" />
          <span className="flex flex-col gap-1"><strong>A huge range</strong><span className="text-[14px] leading-relaxed text-muted">Fashion, hair, phones, home, furniture and machines from verified factories in Guangzhou, Yiwu, Shenzhen and Foshan.</span></span>
        </div>
      </section>

      <nav aria-label="Sections" className="sticky top-2 z-10 grid grid-cols-2 rounded-full border-2 border-success bg-white p-1 text-center text-[14px] font-bold lg:hidden">
        <a href="#guarantee" className="rounded-full py-2.5 text-success hover:bg-success-soft">Order guarantee</a>
        <a href="#security" className="rounded-full py-2.5 text-success hover:bg-success-soft">Security &amp; privacy</a>
      </nav>

      <section id="guarantee" aria-labelledby="g-h" className="flex scroll-mt-20 flex-col gap-4">
        <h2 id="g-h" className="text-center text-[22px] font-extrabold lg:text-left">Order guarantee</h2>
        <ol className="flex flex-col gap-5">
          {GUARANTEE.map(([Icon, t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-[14px] font-extrabold text-white">{i + 1}</span>
              <span className="flex flex-col gap-1">
                <strong className="flex items-center gap-1.5 text-[17px]"><Icon aria-hidden size={18} className="text-success" />{t}</strong>
                <span className="text-[15px] leading-relaxed text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <Link href="/legal/refunds" className="self-start text-[14px] font-bold underline">Read the refund policy</Link>
      </section>

      <section id="security" aria-labelledby="s-h" className="flex scroll-mt-20 flex-col gap-4 border-t border-line pt-6 lg:border-0 lg:pt-0">
        <h2 id="s-h" className="text-center text-[22px] font-extrabold lg:text-left">Security &amp; privacy</h2>
        {SECURITY.map(([Icon, t, points], i) => (
          <div key={t} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-[14px] font-extrabold text-white">{i + 1}</span>
            <span className="flex flex-col gap-2">
              <strong className="flex items-center gap-1.5 text-[17px]"><Icon aria-hidden size={18} className="text-success" />{t}</strong>
              <ul className="flex flex-col gap-1.5">
                {points.map((p) => <li key={p} className="flex gap-2 text-[15px] leading-relaxed text-muted"><BadgeCheck aria-hidden size={18} className="mt-0.5 shrink-0 text-success" />{p}</li>)}
              </ul>
            </span>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pl-11">
          {["Verve", "Visa", "Mastercard", "Bank transfer", "USSD", "Wallet"].map((m) => (
            <span key={m} className="rounded-md border border-line px-3 py-1.5 text-[13px] font-bold">{m}</span>
          ))}
        </div>
        <Link href="/legal/privacy" className="self-start pl-11 text-[14px] font-bold underline">Read the privacy policy</Link>
      </section>
    </div>
  );
}
