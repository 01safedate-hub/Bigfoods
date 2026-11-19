import { ArrowRight, PackagePlus, Ship } from "lucide-react";
import Link from "next/link";
import { naira } from "@/lib/format";
import { MIN_QTY } from "@/lib/wholesale/rules";

/** Red bar on product pages: the same product, wholesale by sea. */
export function WholesaleBar({ from }: { from?: number }) {
  return (
    <Link href="/wholesale" className="flex items-center gap-3 bg-gradient-to-r from-[#E11D2E] to-[#9F0F1C] px-3.5 py-3 text-white md:rounded-lg">
      <Ship aria-hidden size={20} className="shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <strong className="text-[14px]">Visit the wholesale market</strong>
        <span className="truncate text-[12px] text-white/85">
          {from ? <>This item from <strong>{naira(from)}</strong>/unit · </> : null}{MIN_QTY}+ units · by sea
        </span>
      </span>
      <ArrowRight aria-hidden size={18} className="shrink-0" />
    </Link>
  );
}

/** The red wholesale card at the top of Deals. */
export function WholesaleDealsCard() {
  return (
    <Link href="/wholesale" className="group relative isolate flex flex-col gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#F0283A] via-[#C8102E] to-[#6E0711] p-5 text-white shadow-[0_18px_40px_-20px_rgba(200,16,46,0.8)] md:p-7">
      <span aria-hidden className="absolute -right-10 -top-14 -z-10 size-56 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -bottom-16 right-16 -z-10 size-40 rounded-full bg-[#FFB4A8]/20 blur-xl" />
      <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold tracking-[0.14em]"><Ship aria-hidden size={13} /> WHOLESALE · SEA FREIGHT</span>
      <span className="flex flex-col gap-1">
        <strong className="text-[26px] font-extrabold leading-[1.05] md:text-[34px]">Stock your shop at factory prices</strong>
        <span className="max-w-md text-[14px] text-white/90">From {MIN_QTY} units per product, delivered to your pickup station in about 90 days. Starter kits for new businesses inside.</span>
      </span>
      <span className="flex flex-wrap gap-2 text-[12px] font-bold">
        {["Fashion store kit", "Phone business kit", "Hair & beauty kit"].map((k) => <span key={k} className="flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1"><PackagePlus aria-hidden size={13} /> {k}</span>)}
      </span>
      <span className="mt-1 flex w-fit items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[14px] font-extrabold text-sale transition-transform group-hover:translate-x-0.5">
        Open the wholesale market <ArrowRight aria-hidden size={16} />
      </span>
    </Link>
  );
}
