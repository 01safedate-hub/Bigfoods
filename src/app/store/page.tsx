import { Check, Lock, ShieldCheck, ShoppingCart, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { SeaQuote } from "./sea-quote";

/** Marketplace origin. Empty in development (same app), https://fastchina.shop in production. */
const SHOP = (process.env.NEXT_PUBLIC_SHOP_URL ?? "").replace(/\/$/, "");
const SHOP_URL = `${SHOP}/`;

const STEPS = [
  ["Pick a plan", "One setup fee, then monthly. Cancel anytime."],
  ["Choose products", "Tap “+ My store” on anything in our catalogue."],
  ["Get your domain", "We buy it in your name and connect it, SSL included."],
  ["Sell & get paid", "Your margin lands in your wallet after delivery."],
];

const HOW = [
  ["You pay us the retailer price", "Your cost per item is our retailer (10+) price, even for one piece. Our profit is already inside it, so every sale works for both of us."],
  ["You set your own selling price", "Choose a markup rule (for example cost + 30%). When the yuan rate moves, your prices follow so your margin stays the same. We block prices that would lose you money."],
  ["Your customer pays on your site", "Checkout runs on FastChina, so your customers also get Pay small small, Group pay and Jumia pickup stations."],
  ["The payment is split automatically", "We keep the item cost. Your margin goes into your FastChina wallet."],
  ["We buy, check and ship", "Your order joins our daily China purchase. It’s photographed, packed with your brand on the slip and no FastChina prices, then delivered to the customer’s pickup station."],
  ["You get paid", "Your margin is released 7 days after delivery (the return window). Withdraw to any Nigerian bank."],
  ["Returns are fair", "If we sent the wrong or a damaged item, we cover it. If the customer simply changes their mind, your margin on that order is reversed."],
  ["Your discounts, your margin", "Coupons you create come out of your margin. Our promotions never change what you pay us, so your numbers stay predictable."],
];

const PLANS = [
  { name: "Starter", price: "₦7,500", setup: "₦20,000 one-time setup", items: ["Up to 50 products", "yourname.fastchina.store address", "Card, transfer & USSD checkout", "Weekly payouts"], featured: false },
  { name: "Growth", price: "₦15,000", setup: "₦45,000 setup · .com domain included", items: ["Up to 500 products", "Your own domain, bought & connected", "Branded packing slips", "Discount codes & abandoned-cart emails", "Payouts every 3 days"], featured: true },
  { name: "Scale", price: "₦35,000", setup: "₦90,000 setup · domain + business email", items: ["Unlimited products", "Custom-branded packaging option", "Staff accounts & analytics", "Next-day payouts", "Dedicated account manager"], featured: false },
];

export default function StoreHome() {
  return (
    <>
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 bg-ink px-4 py-2.5 text-center text-[13px] text-[#EDE6D3]">
        <span><strong className="font-semibold text-[#D9B866]">Free shipping</strong> on every marketplace item</span>
        <span>Black Friday early access is live</span>
        <span>Wholesale sea freight: Guangzhou → Lagos</span>
      </div>

      <header className="border-b border-[#E6E1D5]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
          <Link href="/store" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-ink font-display text-2xl text-[#D9B866]">F</span>
            <span className="font-display text-[28px]">FastChina<span className="text-[#7A5C17]">.store</span></span>
          </Link>
          <nav aria-label="Main" className="flex flex-1 flex-wrap gap-x-6 gap-y-1 text-[15px] font-medium">
            <Link href={SHOP_URL}>Marketplace</Link>
            <a href="#dropship">Dropship stores</a>
            <a href="#how">How it works</a>
            <a href="#wholesale">Wholesale · Sea</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href={`${SHOP}/account`} className="px-4 py-3 text-[15px] font-medium">Sign in</Link>
            <a href="#pricing" className="rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-[#FBFAF6]">Start selling</a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pt-16 pb-14 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="flex flex-col gap-7">
          <span className="self-start rounded-full border border-[#D9C89A] px-3.5 py-2 text-xs font-semibold tracking-[0.14em] text-[#7A5C17]">DIRECT FROM 1688 FACTORIES</span>
          <h1 className="font-display text-[clamp(48px,6vw,84px)] leading-[0.98] tracking-tight">
            China’s factory floor,
            <br />
            <em className="text-[#7A5C17]">delivered to your door.</em>
          </h1>
          <p className="max-w-[520px] text-lg leading-relaxed text-[#4A4740]">Buy at source prices with free shipping, launch your own branded store in a day, or move containers by sea. One account, three ways to import.</p>
          <form action={`${SHOP}/search`} role="search" className="flex flex-wrap gap-2 rounded-[18px] border border-[#E6E1D5] bg-white p-2 shadow-[0_20px_40px_-24px_rgba(13,13,11,0.25)]">
            <label htmlFor="hero-q" className="sr-only">Search products or paste a 1688 link</label>
            <input id="hero-q" name="q" type="search" placeholder="Search products or paste a 1688 link" className="min-h-12 min-w-0 flex-[1_1_240px] bg-transparent px-3.5 text-base outline-none" />
            <button type="submit" className="min-h-12 rounded-xl bg-ink px-6 text-[15px] font-semibold text-white">Search</button>
          </form>
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#4A4740]">
            {["Pay in Naira", "Photo QC before dispatch", "Buyer protection on every order"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check aria-hidden size={18} className="text-[#0F5C45]" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link href={SHOP_URL} className="relative col-span-2 flex min-h-[260px] flex-col justify-between gap-4 overflow-hidden rounded-[28px] bg-ink p-9 text-white">
            <svg aria-hidden width="260" height="260" viewBox="0 0 200 200" className="absolute -top-12 -right-12">
              {[98, 70, 42].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#D9B866" strokeWidth="0.8" />)}
            </svg>
            <span className="text-xs font-semibold tracking-[0.14em] text-[#D9B866]">BLACK FRIDAY · EARLY ACCESS</span>
            <span className="relative flex flex-col gap-2">
              <span className="font-display text-[56px] leading-none">Up to 50% off</span>
              <span className="text-[#C9C3B3]">Gadgets, home and beauty. Free shipping included.</span>
            </span>
            <span className="self-start rounded-full bg-[#D9B866] px-5 py-3 text-sm font-semibold text-ink">Shop the preview</span>
          </Link>
          <a href="#dropship" className="flex min-h-[180px] flex-col justify-between gap-2.5 rounded-3xl bg-[#E9EFEA] p-6">
            <span className="text-xs font-semibold tracking-[0.12em] text-[#0F5C45]">NEW</span>
            <span className="font-display text-[30px] leading-[1.05]">Your own store, live in 24 hours</span>
            <span className="text-sm font-medium text-[#2D4A3F]">Domain included →</span>
          </a>
          <a href="#wholesale" className="flex min-h-[180px] flex-col justify-between gap-2.5 rounded-3xl bg-[#F1EADB] p-6">
            <span className="text-xs font-semibold tracking-[0.12em] text-[#7A5C17]">WHOLESALE</span>
            <span className="font-display text-[30px] leading-[1.05]">Ship by the CBM, not by the kilo</span>
            <span className="text-sm font-medium text-[#5C4A22]">Get a sea quote →</span>
          </a>
        </div>
      </section>

      <section className="border-y border-[#E6E1D5] bg-white">
        <div className="mx-auto grid max-w-7xl px-6 md:grid-cols-3">
          {[["01", "Marketplace", "Retail buyers. Thousands of 1688 products, Naira prices, free shipping to your pickup station."], ["02", "Dropship stores", "Entrepreneurs. Pick products, set your prices, we host, fulfil and ship under your brand."], ["03", "Wholesale · Sea", "Business owners. Your own China receiving address, consolidated, shipped by sea."]].map(([n, t, d], i) => (
            <div key={n} className={`flex items-start gap-4 py-9 ${i ? "md:border-l md:border-[#E6E1D5] md:pl-7" : ""} md:pr-7`}>
              <span className="font-display text-[40px] leading-none text-[#7A5C17]">{n}</span>
              <span className="flex flex-col gap-1.5"><strong className="text-[17px]">{t}</strong><span className="text-[15px] leading-relaxed text-[#4A4740]">{d}</span></span>
            </div>
          ))}
        </div>
      </section>

      <section id="dropship" className="border-b border-[#E6E1D5] bg-[#F1EDE3]">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2 [&>*]:min-w-0">
          <div className="flex flex-col gap-7">
            <span className="text-xs font-semibold tracking-[0.14em] text-[#7A5C17]">DROPSHIP STORES</span>
            <h2 className="font-display text-[clamp(40px,4.6vw,64px)] leading-none">Your brand. Our warehouse.<br /><em>No stock to hold.</em></h2>
            <p className="max-w-[520px] text-[17px] leading-relaxed text-[#4A4740]">Choose products from our catalogue, set your own selling price, and we build the storefront, register your domain and connect it. When a customer orders, we buy, check, pack and deliver it in your name.</p>
            <ol className="grid gap-3.5 sm:grid-cols-2">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex flex-col gap-1.5 rounded-[18px] bg-white p-5">
                  <span className="font-display text-[26px] text-[#7A5C17]">{i + 1}</span>
                  <strong className="text-[15px]">{t}</strong>
                  <span className="text-sm leading-normal text-[#4A4740]">{d}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[30px] bg-ink p-3.5 shadow-[0_40px_80px_-40px_rgba(13,13,11,0.5)]" aria-label="Example seller storefront">
            <div className="flex items-center gap-2 px-2.5 pt-1.5 pb-3.5">
              {[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-[#3A3A36]" />)}
              <span className="ml-2.5 flex flex-1 items-center gap-2 rounded-full bg-[#1E1E1B] px-3.5 py-2 text-[13px] text-[#C9C3B3]"><Lock aria-hidden size={12} />adaeze-beauty.com</span>
            </div>
            <div className="flex flex-col gap-5 rounded-[20px] bg-[#FFF8F3] p-6">
              <div className="flex items-center justify-between"><span className="font-display text-[26px] text-[#3B1F1A]">Adaeze Beauty</span><span className="text-[13px] text-[#6B4A42]">Shop · About · Cart (2)</span></div>
              <div className="flex flex-col gap-2.5 rounded-2xl bg-[#F4DCD0] p-7">
                <span className="font-display text-[34px] leading-[1.05] text-[#3B1F1A]">Glow season is here.</span>
                <span className="self-start rounded-full bg-[#3B1F1A] px-4 py-2.5 text-[13px] font-semibold text-[#FFF8F3]">Shop the edit</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["Silk scrunchie set", "₦6,500", "#EBD3C6"], ["Ionic hair dryer", "₦38,000", "#E2C9BA"], ["LED vanity mirror", "₦24,900", "#EFDCD1"]].map(([n, p, c]) => (
                  <div key={n} className="flex flex-col gap-1.5"><span className="h-[90px] rounded-xl" style={{ background: c }} /><span className="text-xs text-[#3B1F1A]">{n}</span><strong className="text-[13px] text-[#3B1F1A]">{p}</strong></div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-[#EBD3C6] pt-3.5 text-xs text-[#6B4A42]"><span>Powered by FastChina</span><span className="rounded-full bg-[#E9EFEA] px-2.5 py-1.5 font-semibold text-[#0F5C45]">Your margin today: ₦41,300</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-24">
        <div className="flex max-w-3xl flex-col gap-3">
          <span className="text-xs font-semibold tracking-[0.14em] text-[#7A5C17]">HOW DROPSHIPPING WORKS</span>
          <h2 className="font-display text-[clamp(36px,4vw,56px)] leading-[1.02]">Where the money goes, step by step</h2>
          <p className="text-[17px] leading-relaxed text-[#4A4740]">No surprises: you always know your cost, your margin and when you get paid.</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW.map(([t, d], i) => (
            <li key={t} className="flex flex-col gap-2 rounded-[20px] border border-[#E6E1D5] bg-white p-6">
              <span className="font-display text-3xl text-[#7A5C17]">{String(i + 1).padStart(2, "0")}</span>
              <strong className="text-base">{t}</strong>
              <span className="text-sm leading-relaxed text-[#4A4740]">{d}</span>
            </li>
          ))}
        </ol>
        <p className="rounded-2xl bg-[#E9EFEA] p-5 text-[15px] leading-relaxed text-[#2D4A3F]">
          <strong>If you stop paying your plan:</strong> you get 7 days’ grace, then your store is paused (not deleted). Your domain is registered in your name and stays yours.
        </p>
      </section>

      <section id="pricing" className="mx-auto flex max-w-7xl flex-col gap-10 px-6 pb-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-semibold tracking-[0.14em] text-[#7A5C17]">STORE PLANS</span>
          <h2 className="font-display text-[clamp(36px,4vw,56px)] leading-[1.02]">Pick a plan. Keep 100% of your margin.</h2>
          <p className="text-[#4A4740]">No commission on your sales. You pay the item cost, we handle the rest.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`relative flex flex-col gap-4 rounded-[26px] p-8 ${p.featured ? "bg-ink text-[#FBFAF6]" : "border border-[#E6E1D5] bg-white"}`}>
              {p.featured && <span className="absolute top-6 right-6 rounded-full bg-[#D9B866] px-2.5 py-1.5 text-[11px] font-bold tracking-wider text-ink">MOST POPULAR</span>}
              <strong className="text-lg">{p.name}</strong>
              <span className="flex items-baseline gap-1.5"><span className={`font-display text-[52px] leading-none ${p.featured ? "text-[#D9B866]" : ""}`}>{p.price}</span><span className={`text-sm ${p.featured ? "text-[#C9C3B3]" : "text-[#4A4740]"}`}>/ month</span></span>
              <span className={`text-sm ${p.featured ? "text-[#C9C3B3]" : "text-[#4A4740]"}`}>{p.setup}</span>
              <ul className="flex flex-col gap-2.5 text-[15px]">
                {p.items.map((it) => <li key={it} className="flex gap-2"><Check aria-hidden size={18} className={p.featured ? "text-[#D9B866]" : "text-[#0F5C45]"} />{it}</li>)}
              </ul>
              <a href="#pricing" className={`mt-auto rounded-[14px] p-3.5 text-center text-[15px] font-semibold ${p.featured ? "bg-[#D9B866] text-ink" : "border border-ink"}`}>Choose {p.name}</a>
            </div>
          ))}
        </div>
      </section>

      <section id="wholesale" className="bg-ink text-[#FBFAF6]">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2 [&>*]:min-w-0">
          <div className="flex flex-col gap-7">
            <span className="text-xs font-semibold tracking-[0.14em] text-[#D9B866]">WHOLESALE · SEA FREIGHT ONLY</span>
            <h2 className="font-display text-[clamp(40px,4.6vw,64px)] leading-none">Your own address in China.<br /><em className="text-[#D9B866]">Your goods, by the container.</em></h2>
            <p className="max-w-[540px] text-[17px] leading-relaxed text-[#C9C3B3]">For verified business buyers. Have your suppliers deliver to your personal FastChina receiving address in Guangzhou or Yiwu. We weigh, photograph, consolidate and ship everything to Nigeria by sea.</p>
            <ol className="grid overflow-hidden rounded-[20px] border border-[#2A2A26] sm:grid-cols-3">
              {[["Get your address", "A unique shipping mark tied to your account."], ["Suppliers deliver", "Every carton logged with photos & CBM."], ["We sail & clear", "Regular departures, customs handled."]].map(([t, d], i) => (
                <li key={t} className="flex flex-col gap-1.5 border-[#2A2A26] bg-[#141412] p-5 sm:border-l sm:first:border-l-0"><span className="font-display text-[34px] text-[#D9B866]">{i + 1}</span><strong className="text-[15px]">{t}</strong><span className="text-sm leading-normal text-[#A8A294]">{d}</span></li>
              ))}
            </ol>
            <div className="flex flex-col gap-2.5 rounded-[20px] border border-[#2A2A26] bg-[#141412] p-5">
              <span className="text-xs font-semibold tracking-[0.12em] text-[#A8A294]">YOUR CHINA RECEIVING ADDRESS · EXAMPLE</span>
              <span className="font-mono text-sm leading-[1.7] whitespace-pre-line break-words text-[#EDE6D3]">{"FastChina Warehouse — Mark: FC-LAG-20481\n[WAREHOUSE STREET ADDRESS], Baiyun District\nGuangzhou, Guangdong 510000, China\nTel: [WAREHOUSE PHONE]"}</span>
            </div>
          </div>
          <SeaQuote />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 sm:grid-cols-2 lg:grid-cols-4">
        {[[ShieldCheck, "Buyer protection", "Your payment is held until the item is delivered as described."], [Truck, "Photo QC", "See your goods in our China warehouse before they ship."], [Wallet, "Pay your way", "Card, bank transfer or USSD, always in Naira."], [ShoppingCart, "Live tracking", "From the factory gate to the pickup station, every step."]].map(([Icon, t, d]) => {
          const I = Icon as typeof ShieldCheck;
          return (
            <div key={t as string} className="flex flex-col gap-2.5">
              <I aria-hidden size={28} strokeWidth={1.5} className="text-[#7A5C17]" />
              <strong className="text-base">{t as string}</strong>
              <span className="text-sm leading-relaxed text-[#4A4740]">{d as string}</span>
            </div>
          );
        })}
      </section>

      <footer className="bg-ink text-[#C9C3B3]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 pt-16 pb-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-3.5 lg:col-span-2">
            <span className="font-display text-[34px] text-[#FBFAF6]">FastChina<span className="text-[#D9B866]">.store</span></span>
            <span className="max-w-[340px] text-sm leading-relaxed">Import from China without the stress. Shop, sell, or ship by sea.</span>
          </div>
          {[["Shop", [["Marketplace", SHOP_URL], ["Deals", `${SHOP}/deals`], ["Track order", `${SHOP}/account`]]], ["Sell", [["Dropship stores", "#dropship"], ["Plans", "#pricing"], ["Wholesale", "#wholesale"]]], ["Help", [["How it works", "#how"], ["Returns", `${SHOP}/account`], ["Prohibited items", `${SHOP}/account`]]]].map(([h, links]) => (
            <div key={h as string} className="flex flex-col gap-2.5 text-sm">
              <strong className="text-[#FBFAF6]">{h as string}</strong>
              {(links as string[][]).map(([l, href]) => <a key={l} href={href}>{l}</a>)}
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-[#2A2A26] px-6 pt-5 pb-8 text-[13px] text-[#A8A294]">
          <span>© 2026 FastChina.store</span>
          <span>Terms · Privacy · Cookies</span>
        </div>
      </footer>
    </>
  );
}
