import type { Metadata } from "next";
import { connection } from "next/server";
import { getSeller } from "@/lib/data/seller";
import { FREE_SALES_LIMIT, PLANS } from "@/lib/dropship/plans";
import { DemoNote, Gate } from "../_ui/gate";
import { Card, Meter, ngn, Page } from "../_ui/ui";
import { UpgradeButton } from "./upgrade-button";

export const metadata: Metadata = { title: "Plan" };

export default async function PlanPage() {
  await connection();
  const state = await getSeller();
  if (state.kind !== "live" && state.kind !== "demo") return <Gate state={state} />;
  const s = state.data.store;
  return (
    <Page title="Your plan" subtitle={s.plan_renews_at ? `${PLANS[s.plan].name} · renews ${new Date(s.plan_renews_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Africa/Lagos" })}` : `${PLANS[s.plan].name} plan`}>
      <DemoNote demo={state.kind === "demo"} />
      {s.plan === "free" && (
        <Card>
          <div className="mb-2 flex justify-between text-[14px]"><strong>Free sales limit</strong><span className="tabular-nums text-[#A1A1AA]">{ngn(s.lifetime_sales)} / {ngn(FREE_SALES_LIMIT)}</span></div>
          <Meter value={s.lifetime_sales} max={FREE_SALES_LIMIT} label="Sales towards the free limit" tone={s.lifetime_sales >= FREE_SALES_LIMIT * 0.9 ? "red" : "gold"} />
          <p className="mt-2 text-[13px] text-[#A1A1AA]">Free stores can sell up to {ngn(FREE_SALES_LIMIT)} in total. After that, new orders pause until you upgrade. Your products and earnings stay safe.</p>
        </Card>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        {(Object.values(PLANS)).map((p) => {
          const current = p.key === s.plan;
          const featured = p.key === "pro";
          return (
            <section key={p.key} className={`relative flex flex-col gap-4 rounded-2xl p-5 ${featured ? "bg-gradient-to-b from-[#2B2410] to-[#17171A] ring-1 ring-[#F5C542]/60" : "bg-[#17171A]"}`}>
              {featured && <span className="absolute right-4 top-4 rounded-full bg-[#F5C542] px-2.5 py-1 text-[10px] font-black uppercase text-black">Most popular</span>}
              <div>
                <h2 className="text-[22px] font-black">{p.name}</h2>
                <p className="mt-1"><strong className="text-[30px] font-black tabular-nums">{p.price ? ngn(p.price) : "₦0"}</strong><span className="text-[13px] text-[#A1A1AA]">{p.price ? " / month" : " forever"}</span></p>
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-[14px]">
                {p.perks.map((perk) => <li key={perk} className="flex gap-2"><span aria-hidden className="text-[#3DDC84]">✓</span>{perk}</li>)}
              </ul>
              {current ? <span className="flex min-h-11 items-center justify-center rounded-full border border-white/15 text-[14px] font-bold text-[#A1A1AA]">Current plan</span>
                : p.key === "free" ? null : <UpgradeButton plan={p.key} label={`Get ${p.name}`} featured={featured} />}
            </section>
          );
        })}
      </div>
      <p className="text-[12px] text-[#6B6B73]">Fees are a percentage of your markup only, never of FastChina’s price. Cancel any time: you keep your store on the Free plan with your oldest 20 products.</p>
    </Page>
  );
}
