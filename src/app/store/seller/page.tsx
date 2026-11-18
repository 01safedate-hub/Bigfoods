import { ArrowUpRight, Package, Paintbrush, TrendingUp } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { FREE_SALES_LIMIT, PLANS } from "@/lib/dropship/plans";
import { getSeller } from "@/lib/data/seller";
import { DemoNote, Gate } from "./_ui/gate";
import { SalesChart } from "./_ui/sales-chart";
import { ShareStore } from "./_ui/share-store";
import { btn, Card, CardTitle, Meter, ngn, ngnShort, Page, Stat, StatusPill } from "./_ui/ui";

const greet = () => {
  const h = Number(new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Lagos" }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export default async function SellerHome() {
  await connection(); // personal, live data: never prerendered
  const state = await getSeller();
  if (state.kind !== "live" && state.kind !== "demo") return <Gate state={state} />;
  const d = state.data;
  const plan = PLANS[d.store.plan];
  const conversion = d.visits_30d ? ((d.orders_30d / d.visits_30d) * 100).toFixed(1) : "0.0";
  const free = d.store.plan === "free";
  const used = d.store.lifetime_sales / FREE_SALES_LIMIT;
  const storeUrl = d.store.custom_domain && d.store.domain_verified ? `https://${d.store.custom_domain}` : `https://${d.store.slug}.fastchina.store`;

  return (
    <Page
      title={`${greet()}, ${d.store.name}`}
      subtitle={<>{plan.name} plan · <a href={storeUrl} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-4 hover:text-white">{storeUrl.replace("https://", "")}</a></>}
      action={<ShareStore url={storeUrl} name={d.store.name} />}
    >
      <DemoNote demo={state.kind === "demo"} />

      {d.store.status === "needs_upgrade" && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#3A1416] p-4">
          <div>
            <strong className="block text-[16px]">You’ve passed {ngn(FREE_SALES_LIMIT)} in sales 🎉</strong>
            <span className="text-[13px] text-[#FFB4B4]">Your store is paused for new orders. Upgrade to Pro to keep selling with no limit.</span>
          </div>
          <Link href="/store/seller/plan" className={btn.primary}>Upgrade now</Link>
        </div>
      )}
      {free && d.store.status === "active" && used >= 0.75 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#2B2410] p-4">
          <span className="text-[14px] text-[#F5C542]">You’ve sold {ngnShort(d.store.lifetime_sales)} of your {ngnShort(FREE_SALES_LIMIT)} free limit. Upgrade before you hit it so orders never stop.</span>
          <Link href="/store/seller/plan" className={btn.ghost}>See plans</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sales · 30 days" value={ngnShort(d.sales_30d)} sub={`${d.orders_30d} paid orders`} />
        <Stat label="Your profit · 30 days" value={ngnShort(d.profit_30d)} sub={`after the ${plan.feePct}% fee`} tone="green" />
        <Stat label="Visits · 30 days" value={d.visits_30d.toLocaleString("en-NG")} sub={`${conversion}% bought`} />
        <Stat label="Ready to pay out" value={ngnShort(d.earnings.available)} sub="paid this Friday" tone="gold" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.7fr_1fr]">
        <Card>
          <SalesChart daily={d.daily} />
        </Card>
        <Card className="flex flex-col gap-4">
          <CardTitle action={<Link href="/store/seller/earnings" className="text-[12px] font-bold text-[#A1A1AA] hover:text-white">Details</Link>}>Earnings</CardTitle>
          {[
            ["On the way", d.earnings.pending, "Paid once delivered"],
            ["Ready", d.earnings.available, "Next payout: Friday"],
            ["Paid to you", d.earnings.paid, "All time"],
          ].map(([k, v, s]) => (
            <div key={k as string} className="flex items-baseline justify-between gap-2">
              <span><span className="block text-[14px] font-bold">{k}</span><span className="text-[12px] text-[#8A8A93]">{s}</span></span>
              <strong className="text-[18px] tabular-nums">{ngn(v as number)}</strong>
            </div>
          ))}
          {!d.store.has_bank && <Link href="/store/seller/earnings" className="rounded-md bg-[#2B2410] px-3 py-2 text-[13px] font-semibold text-[#F5C542]">Add your bank account to get paid →</Link>}
        </Card>
      </div>

      {free && (
        <Card>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[15px] font-extrabold">Free plan</h2>
            <span className="text-[12px] text-[#A1A1AA]">{d.products} of {plan.maxProducts} products · {ngnShort(d.store.lifetime_sales)} of {ngnShort(FREE_SALES_LIMIT)} sales</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Meter value={d.products} max={plan.maxProducts} label="Products used" />
            <Meter value={d.store.lifetime_sales} max={FREE_SALES_LIMIT} label="Sales towards the free limit" tone={used >= 0.9 ? "red" : "gold"} />
          </div>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/store/seller/orders" className="text-[12px] font-bold text-[#A1A1AA] hover:text-white">All orders</Link>}>Recent orders</CardTitle>
          {d.recent.length === 0 && <p className="py-6 text-center text-[#8A8A93]">No orders yet. Share your store link to get your first sale.</p>}
          <ul className="flex flex-col">
            {d.recent.map((o) => (
              <li key={o.code} className="flex items-center gap-3 border-t border-white/5 py-2.5 first:border-0">
                <span className="min-w-0 flex-1">
                  <strong className="block font-mono text-[13px]">#{o.code}</strong>
                  <span className="text-[12px] text-[#8A8A93]">{o.state} · {ngn(o.total_ngn)}</span>
                </span>
                <span className="text-right text-[13px] font-bold text-[#3DDC84] tabular-nums">{o.profit ? `+${ngn(o.profit)}` : ""}</span>
                <StatusPill status={o.status} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Best sellers</CardTitle>
          {d.top.length === 0 && <p className="py-6 text-center text-[#8A8A93]">Your best sellers will show here.</p>}
          <ol className="flex flex-col">
            {d.top.map((t, i) => (
              <li key={t.title} className="flex items-center gap-3 border-t border-white/5 py-2.5 first:border-0">
                <span className="w-5 text-center text-[15px] font-black text-[#6B6B73]">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{t.title}</span>
                <span className="text-[12px] text-[#8A8A93]">{t.units} sold</span>
                <span className="w-24 text-right text-[13px] font-bold text-[#3DDC84] tabular-nums">+{ngn(t.profit)}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["/store/seller/products", Package, "Add products", "Pick from FastChina’s catalogue"],
          ["/store/seller/design", Paintbrush, "Design your store", "Theme, colour and name"],
          ["/store/seller/plan", TrendingUp, free ? "Go Pro" : "Your plan", free ? "More products, themes, your domain" : `${plan.name} · ${plan.feePct}% fee`],
        ].map(([href, Icon, t, s]) => {
          const I = Icon as typeof Package;
          return (
            <Link key={href as string} href={href as string} className="group flex items-center gap-3 rounded-xl bg-[#17171A] p-4 transition-colors hover:bg-[#1E1E22]">
              <span className="flex size-11 items-center justify-center rounded-lg bg-[#F5C542] text-black"><I aria-hidden size={20} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-[15px]">{t as string}</strong><span className="text-[12px] text-[#8A8A93]">{s as string}</span></span>
              <ArrowUpRight aria-hidden size={18} className="text-[#6B6B73] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
