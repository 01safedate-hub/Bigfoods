/**
 * Guides: long-form answers to what Nigerians search before they import or start selling.
 * Each one targets a real search ("how to start dropshipping in Nigeria for free") and links
 * to the page that solves it. Keep facts in step with how the site works; date every update.
 *
 * Inline syntax in paragraphs: [link text](/path) and **bold**.
 */

export type Block =
  | string
  | { list: string[] }
  | { steps: [title: string, text: string][] }
  | { table: { head: string[]; rows: string[][] } }
  | { tip: string };

export interface Guide {
  slug: string;
  /** <title>, under 60 characters. */
  title: string;
  h1: string;
  description: string;
  /** Main search phrase first. */
  keywords: string[];
  topic: "Dropshipping" | "Importing" | "Wholesale" | "Buying guides";
  published: string;
  updated: string;
  summary: string;
  sections: { h: string; blocks: Block[] }[];
  faqs: { q: string; a: string }[];
  cta: { title: string; text: string; label: string; href: string };
}

const STORE = "https://fastchina.store";

export const GUIDES: Guide[] = [
  {
    slug: "how-to-start-dropshipping-in-nigeria-for-free",
    title: "How to Start Dropshipping in Nigeria for Free (2026)",
    h1: "How to start dropshipping in Nigeria for free",
    description: "A step-by-step 2026 guide to starting a dropshipping business in Nigeria with no money: choosing products, pricing, getting paid and delivering without holding stock.",
    keywords: ["how to start dropshipping in Nigeria for free", "dropshipping in Nigeria", "dropshipping without money", "free dropshipping store Nigeria", "dropshipping from China to Nigeria"],
    topic: "Dropshipping",
    published: "2026-11-18",
    updated: "2026-11-18",
    summary: "You can start dropshipping in Nigeria without capital: open a free store, list products a supplier holds, add your profit on top, and only pay for an item after your customer has paid you.",
    sections: [
      {
        h: "What dropshipping is, in one minute",
        blocks: [
          "Dropshipping means you sell products you don't keep. A customer buys from your store, the supplier buys or packs the item and delivers it to your customer, and you keep the difference between your selling price and the supplier's price.",
          "The big advantage in Nigeria is cash flow. You never tie money up in stock that may not sell, you don't rent a shop, and you don't fight with dispatch riders. The trade-off is that you earn a margin per sale instead of a bulk-buying discount, and you depend on your supplier's delivery time.",
        ],
      },
      {
        h: "What you need (and what you don't)",
        blocks: [
          { list: [
            "**A phone with data.** Everything below works from a phone.",
            "**A supplier who delivers inside Nigeria.** Shipping from China yourself, one parcel at a time, is slow and expensive. Use a supplier that consolidates orders and delivers locally.",
            "**A store link.** A free store on a subdomain is enough to begin. A custom .com.ng or .com can come later.",
            "**A bank account** to receive your profit.",
          ] },
          "You **don't** need a CAC registration to start testing, a warehouse, stock, or money for ads. Free traffic from WhatsApp status, Instagram and TikTok is how most Nigerian dropshippers make their first sales.",
        ],
      },
      {
        h: "Step by step: your first store in a day",
        blocks: [
          { steps: [
            ["Pick a niche you can talk about", "Wigs, beauty tools, phone accessories, watches and home gadgets sell well because people already buy them online and they ship by air. Pick one niche so your store looks focused."],
            ["Open a free store", `On [FastChina.store](${STORE}/seller) the Free plan costs nothing, holds 20 products and gives you a link like yourname.fastchina.store. There's no monthly fee until you pass ₦2,000,000 in total sales.`],
            ["Choose 10–20 products", "Start with items between ₦5,000 and ₦40,000. They're easy impulse buys, and Pay small small helps with dearer ones. Read the Q&A on each product so you can answer customers."],
            ["Set your markup", "Your selling price is the supplier's price plus your markup. A 20–40% markup is common. Check that your price is still fair against Jumia and Instagram sellers."],
            ["Share your store everywhere", "Post one product a day on WhatsApp status, make short videos, and reply fast. Trust sells more than ads at the start."],
            ["Get paid after delivery", "When your customer collects the order, your margin (minus the plan fee) is released to your earnings and paid to your bank weekly."],
          ] },
        ],
      },
      {
        h: "How much can you make?",
        blocks: [
          "Your profit per sale is your markup minus the platform fee. On FastChina's Free plan the fee is 5% of your markup, not of the whole price.",
          { table: {
            head: ["Product price", "Your markup", "You sell at", "Fee (5% of markup)", "You keep"],
            rows: [
              ["₦12,000", "30% (₦3,600)", "₦15,600", "₦180", "₦3,420"],
              ["₦25,000", "25% (₦6,250)", "₦31,300", "₦318", "₦5,982"],
              ["₦60,000", "20% (₦12,000)", "₦72,000", "₦600", "₦11,400"],
            ],
          } },
          "Twenty sales of the middle example in a month is about ₦120,000 in profit without buying any stock. As sales grow, Pro (₦15,000 a month, 3% fee) and Elite (₦45,000 a month, 1.5% fee) cut the fee and add your own domain and premium themes.",
          { tip: "Prices in naira move when the yuan rate moves. Use a percentage markup so your profit moves with the price instead of shrinking." },
        ],
      },
      {
        h: "Delivery: the part that makes or breaks you",
        blocks: [
          "Most Nigerian customers have been burned by late deliveries. Be honest about timing. Air items from China usually arrive in **10–18 days**; furniture and big items go by sea and take **90 days or more**. Put this in your store description and repeat it in DMs.",
          "Delivery to a Jumia pickup station is the most reliable option across Nigeria: customers collect with a code and ID, so there are no failed home deliveries.",
        ],
      },
      {
        h: "Mistakes that kill new dropshipping stores",
        blocks: [
          { list: [
            "Listing 500 random products. A focused store of 20 good items converts better.",
            "Copying prices that are too low to leave you a margin after fees.",
            "Promising 3-day delivery on items that come from China.",
            "Ignoring messages. Reply within an hour during the day.",
            "Paying for ads before you have made organic sales. Learn what sells first.",
          ] },
        ],
      },
    ],
    faqs: [
      { q: "Can I really start dropshipping in Nigeria with no money?", a: "Yes. A free store, products held by your supplier and payment collected before you pay anything means you can start without capital. You only need a phone, data and time to market your store." },
      { q: "Is dropshipping legal in Nigeria?", a: "Yes. Dropshipping is ordinary retail. As your business grows, register it with the Corporate Affairs Commission (CAC) and keep records for tax." },
      { q: "Do I need a CAC certificate to start?", a: "Not to test the idea. Many sellers register once they have regular sales. A registered name builds trust and makes business banking easier." },
      { q: "How do I get paid?", a: "On FastChina.store your margin is released after the customer collects their order and is paid to your Nigerian bank account weekly." },
      { q: "What happens if a customer wants a refund?", a: "If the item was wrong or damaged, the supplier covers it. If the customer simply changes their mind, your margin on that order is reversed. Explain your returns policy before people buy." },
    ],
    cta: { title: "Open your free store", text: "20 products, your own store link, no monthly fee until ₦2,000,000 in sales.", label: "Start for free", href: `${STORE}/seller` },
  },

  {
    slug: "how-to-import-from-china-to-nigeria",
    title: "How to Import Goods from China to Nigeria (2026 Guide)",
    h1: "How to import goods from China to Nigeria",
    description: "Everything you need to import from China to Nigeria in 2026: where to buy, how to pay suppliers, air vs sea shipping, customs clearing and how to avoid losing money.",
    keywords: ["how to import from China to Nigeria", "importing from China to Nigeria", "import goods from China", "China to Nigeria shipping", "buy from China in Nigeria"],
    topic: "Importing",
    published: "2026-11-18",
    updated: "2026-11-18",
    summary: "To import from China you choose a supplier (1688, Alibaba or a market agent), pay in yuan or dollars, ship to a China warehouse, send it by air or sea, clear customs and deliver it locally. A consolidator can do every step for you in naira.",
    sections: [
      {
        h: "The five steps of importing from China",
        blocks: [
          { steps: [
            ["Find a supplier", "1688.com is China's domestic wholesale site with the lowest prices. Alibaba.com is for export orders with higher minimums. AliExpress is retail. Market agents in Guangzhou and Yiwu buy for you in person."],
            ["Pay the supplier", "Chinese suppliers want yuan (Alipay, WeChat Pay, bank transfer) or dollars. This is the hardest part from Nigeria, which is why most importers use an agent or a platform that accepts naira."],
            ["Receive the goods in China", "Suppliers ship inside China to a warehouse address, usually in Guangzhou. The warehouse checks, photographs and repacks your goods."],
            ["Ship to Nigeria", "Air freight is charged per kilogram and takes about 10–18 days. Sea freight is charged per cubic metre (CBM) and takes 90 days or more for consolidated cargo."],
            ["Clear customs and deliver", "Goods must be cleared through the Nigeria Customs Service. Consolidators include clearing in a per-kg rate so you don't deal with the port yourself."],
          ] },
        ],
      },
      {
        h: "The easiest way: buy in naira from a platform",
        blocks: [
          "If you don't want to handle yuan, freight and clearing, buy from a platform that does it all. On [FastChina.shop](/) every 1688 product is priced in naira with the shipping and clearing already inside the price. You pay once, and the item arrives at your nearest Jumia pickup station.",
          "For goods you've sourced yourself, [wholesale sea freight](/wholesale) gives you a China receiving address and ships your cargo by the cubic metre.",
        ],
      },
      {
        h: "How much does importing cost?",
        blocks: [
          "Your landed cost is the product price plus four things that beginners forget:",
          { list: [
            "**Exchange rate.** Suppliers price in yuan. Every naira you pay goes through a dollar or yuan rate.",
            "**China domestic shipping.** From the factory to the warehouse, often ¥5–¥20 per parcel.",
            "**International freight.** Per kg for air, per CBM for sea.",
            "**Clearing and last-mile delivery.** Customs, port handling and the trip to your door or pickup station.",
          ] },
          "Read our breakdown of [shipping costs from China to Nigeria](/guides/shipping-from-china-to-nigeria-cost) for worked examples.",
        ],
      },
      {
        h: "Paperwork for bigger imports",
        blocks: [
          "Small parcels bought through a consolidator are cleared under the consolidator's arrangements. If you import large commercial shipments in your own name, you'll deal with Form M through your bank, a customs broker, and the duty rate for your goods' tariff code. Some products also need NAFDAC or SONCAP approval. Check the Nigeria Customs Service import prohibition list before buying anything unusual.",
          { tip: "Starting out? Import small quantities through a consolidator first. Learn what sells before you take on container-sized risk." },
        ],
      },
      {
        h: "How to avoid losing money",
        blocks: [
          { list: [
            "Ask for real photos or a video of the exact item before paying in full.",
            "Weigh the item, or ask the supplier for the weight, before you work out your price. Freight can cost more than the product.",
            "Avoid branded copies. They can be seized at customs.",
            "Never pay a stranger's personal account because they \"know someone at the port\".",
          ] },
          "More in [how to avoid scams when buying from China](/guides/how-to-avoid-scams-when-buying-from-china).",
        ],
      },
    ],
    faqs: [
      { q: "Can I import from China without travelling?", a: "Yes. Most importers never visit China. You buy online (1688, Alibaba or a platform like FastChina), and a warehouse in China receives, checks and ships your goods." },
      { q: "How long does shipping from China to Nigeria take?", a: "Air freight takes about 10–18 days door to pickup station. Sea freight for consolidated cargo takes 90 days or more." },
      { q: "Do I need to pay customs duty?", a: "Imports are subject to Nigerian customs duty and charges. When you buy through FastChina, clearing is already included in the price." },
      { q: "What is the minimum I can import?", a: "Through FastChina you can buy a single item. Buying 10 or more of one item gets the retailer price." },
    ],
    cta: { title: "Shop China in naira", text: "1688 products with shipping and clearing already included.", label: "Browse the marketplace", href: "/" },
  },

  {
    slug: "how-to-buy-from-1688-in-nigeria",
    title: "How to Buy from 1688 in Nigeria (No Agent Needed)",
    h1: "How to buy from 1688.com in Nigeria",
    description: "1688 has China's lowest wholesale prices but only accepts Chinese payment and addresses. Here's how Nigerians buy from 1688, what it costs and how to read listings.",
    keywords: ["how to buy from 1688 in Nigeria", "1688 Nigeria", "1688 agent Nigeria", "buy from 1688", "1688 shipping to Nigeria"],
    topic: "Importing",
    published: "2026-11-18",
    updated: "2026-11-18",
    summary: "1688.com is Alibaba's site for Chinese domestic buyers, so it needs a Chinese address and payment. Nigerians buy through an agent or a platform that lists 1688 products in naira and handles payment, shipping and clearing.",
    sections: [
      {
        h: "What is 1688?",
        blocks: [
          "1688.com is owned by Alibaba Group and serves buyers inside China. Factories and wholesalers list there at the prices they charge Chinese shops, which is usually far cheaper than Alibaba.com (export) or AliExpress (retail). The catch: the site is in Chinese, prices are in yuan, payment needs Alipay, and sellers only deliver inside China.",
        ],
      },
      {
        h: "Three ways to buy from 1688 from Nigeria",
        blocks: [
          { table: {
            head: ["Option", "How it works", "Good for"],
            rows: [
              ["Platform in naira", "Products from 1688 listed in naira with freight and clearing included. You pay once.", "Single items, resellers, anyone who wants a fixed price"],
              ["Buying agent", "You send links; the agent pays, collects and ships, adding a service fee.", "Custom orders and mixed cartons"],
              ["Do it yourself", "Chinese bank or Alipay account, Chinese warehouse address, your own freight forwarder.", "Experienced importers with large volumes"],
            ],
          } },
          "On [FastChina](/), you can also paste a 1688 link into search to find that product.",
        ],
      },
      {
        h: "How to read a 1688 listing",
        blocks: [
          { list: [
            "**Tiered prices.** 1688 shows a price for 1+, 50+, 200+ pieces. The lowest tier only applies to big orders.",
            "**SKU options.** Colour and size choices can change the price. Check the variant you want.",
            "**起批 (minimum order).** Some sellers set a minimum quantity.",
            "**Weight.** Listings often include a weight. It decides your air freight cost.",
            "**Seller age and rating.** Prefer verified factories (实力商家) with several years on the platform.",
          ] },
        ],
      },
      {
        h: "What 1688 products really cost in Nigeria",
        blocks: [
          "A ¥50 item does not cost ¥50 delivered. Add the exchange rate, freight by weight, clearing and local delivery, then the seller's profit. A light item (under 300g) usually lands at 2–3 times the yuan price converted to naira; a heavy item much more. That's why light, high-value products are the best to import by air.",
          { tip: "Compare the delivered price, not the 1688 price. A cheaper listing that weighs twice as much can end up costing more." },
        ],
      },
    ],
    faqs: [
      { q: "Can I pay 1688 sellers with a Nigerian card?", a: "Usually not. 1688 expects Alipay or a Chinese bank. That's why Nigerians use agents or platforms that accept naira." },
      { q: "Does 1688 ship to Nigeria?", a: "No. 1688 sellers deliver within China. A warehouse or forwarder in China receives your items and ships them on." },
      { q: "Is 1688 cheaper than AliExpress?", a: "Usually, yes, because 1688 prices are domestic wholesale prices. But you have to add international shipping yourself, which AliExpress often includes." },
    ],
    cta: { title: "1688 prices, in naira", text: "Free shipping to your Jumia pickup station. No Alipay, no agent.", label: "Shop 1688 products", href: "/" },
  },

  {
    slug: "shipping-from-china-to-nigeria-cost",
    title: "Shipping from China to Nigeria: Cost & Time (2026)",
    h1: "Shipping from China to Nigeria: air vs sea, cost and time",
    description: "How much shipping from China to Nigeria costs in 2026, how air and sea freight are priced (per kg and per CBM), how long each takes, and how to pay less.",
    keywords: ["shipping from China to Nigeria cost", "air freight China to Nigeria", "sea freight China to Lagos", "how long does shipping from China to Nigeria take", "cost per kg China to Nigeria"],
    topic: "Importing",
    published: "2026-11-18",
    updated: "2026-11-18",
    summary: "Air freight from China to Nigeria is charged per kilogram and takes about 10–18 days. Sea freight is charged per cubic metre (CBM) and takes 90 days or more. Clearing and local delivery are on top unless your rate includes them.",
    sections: [
      {
        h: "Air vs sea at a glance",
        blocks: [
          { table: {
            head: ["", "Air freight", "Sea freight"],
            rows: [
              ["Charged by", "Weight (kg), or volume weight if bulky", "Volume (CBM)"],
              ["Time to Nigeria", "About 10–18 days", "90 days or more"],
              ["Best for", "Clothes, hair, phones, beauty, accessories", "Furniture, machines, large quantities"],
              ["Minimum", "Usually 1 kg", "Usually 0.5 CBM for shared containers"],
            ],
          } },
        ],
      },
      {
        h: "How air freight is calculated",
        blocks: [
          "Air cargo is billed on the **greater** of real weight and volume weight. Volume weight is length × width × height in cm ÷ 6,000 (some forwarders use 5,000). A light but bulky pillow can be charged as if it weighed several kilograms.",
          "Forwarders quote per kilogram, and customs clearing is often a separate per-kg charge. At FastChina, clearing of ₦1,800 per kg is already included in product prices.",
        ],
      },
      {
        h: "How sea freight is calculated",
        blocks: [
          "Shared-container (LCL) sea freight is billed per cubic metre: a box 1m × 1m × 1m is 1 CBM. A 20ft container holds about 28 CBM and a 40ft about 58 CBM. Add port handling and clearing in Lagos (Apapa or Tin Can) or Onne.",
          "Use our [sea freight estimator](/wholesale#sea) to price your own cargo by the CBM.",
        ],
      },
      {
        h: "Five ways to pay less for shipping",
        blocks: [
          { list: [
            "Choose light products. Under 500g per item is the sweet spot for air.",
            "Remove bulky retail boxes where it's safe to do so.",
            "Consolidate: many small orders shipped together cost less than separate parcels.",
            "Send big, heavy goods by sea and plan 3–4 months ahead.",
            "Buy from a platform with free shipping built in, so you know the total before you pay.",
          ] },
        ],
      },
    ],
    faqs: [
      { q: "How much is shipping per kg from China to Nigeria?", a: "Rates change with fuel prices and the exchange rate. Get a current quote that states whether clearing is included. On FastChina.shop shipping is already inside the product price, so delivery to your pickup station is free." },
      { q: "How long does sea shipping from China to Lagos take?", a: "Plan for 90 days or more from when your cargo leaves our China warehouse until it's cleared and delivered." },
      { q: "Is customs clearing included?", a: "With many forwarders it isn't. At FastChina, clearing is included in marketplace prices and shown separately on sea freight quotes." },
    ],
    cta: { title: "Free shipping on every item", text: "Air and sea freight, clearing and delivery to your Jumia pickup station, all in one price.", label: "Shop with free shipping", href: "/" },
  },

  {
    slug: "how-to-buy-wholesale-from-china",
    title: "How to Buy Wholesale from China for Your Business",
    h1: "How to buy wholesale from China for your small business",
    description: "A practical guide for Nigerian retailers buying wholesale from China: minimum order quantities, mixing products, retailer pricing from 10 units and sea freight for bulk orders.",
    keywords: ["buy wholesale from China", "wholesale from China to Nigeria", "China wholesale market Nigeria", "bulk buying from China", "wholesale prices from China"],
    topic: "Wholesale",
    published: "2026-11-18",
    updated: "2026-11-18",
    summary: "Buying wholesale from China means ordering enough of each item to unlock lower unit prices. Start with small mixed orders at retailer prices, then move to sea freight once you know what sells.",
    sections: [
      {
        h: "What counts as wholesale?",
        blocks: [
          "Chinese suppliers lower the unit price as quantity rises. On 1688 you'll see tiers like 1–49, 50–199 and 200+ pieces. For a Nigerian shop owner, the sweet spot is usually a mixed order: 10–50 pieces each of several products, so you test more items without tying up all your money in one.",
        ],
      },
      {
        h: "Retailer prices from 10 units",
        blocks: [
          "On the [FastChina wholesale market](/wholesale), any item bought 10 or more at a time gets the retailer price automatically, up to 40% off our profit. You can mix colours and sizes of the same product to reach 10, and it still ships free to your pickup station.",
        ],
      },
      {
        h: "When to switch to sea freight",
        blocks: [
          "Once you're buying hundreds of pieces, or anything bulky, sea freight is much cheaper per item. You'll wait 90 days or more, so keep a rolling order: buy the next batch while the current one is on the water.",
          `With [wholesale sea freight](${STORE}) you get your own China receiving address. Suppliers deliver there, we consolidate and you pay by the CBM.`,
        ],
      },
      {
        h: "A simple wholesale buying checklist",
        blocks: [
          { list: [
            "Test new products with 10–20 pieces before buying 100.",
            "Work out your landed cost per piece, including freight, before agreeing a selling price.",
            "Ask for a photo of the bulk goods, not just the sample.",
            "Keep 20–30% of your budget for reorders of what sells fast.",
            "Track sell-through: anything not half sold in 60 days shouldn't be reordered.",
          ] },
        ],
      },
    ],
    faqs: [
      { q: "What's the minimum order for wholesale prices?", a: "On FastChina, 10 units of an item unlock the retailer price. For your own goods by sea, the minimum is 0.5 CBM." },
      { q: "Can I mix products in one wholesale order?", a: "Yes. Retailer pricing applies per product at 10+ units, and you can buy as many different products as you like in one order." },
      { q: "Which is the biggest wholesale market in China?", a: "Yiwu International Trade City in Zhejiang is the largest small-goods market. Guangzhou is the hub for clothing, hair, leather and electronics, and Foshan for furniture." },
    ],
    cta: { title: "Wholesale market", text: "Retailer prices from 10 units, free shipping, mix colours and sizes.", label: "Open the wholesale market", href: "/wholesale" },
  },

  {
    slug: "1688-vs-alibaba-vs-aliexpress",
    title: "1688 vs Alibaba vs AliExpress: Which Is Best for Nigerians?",
    h1: "1688 vs Alibaba vs AliExpress: which should you buy from?",
    description: "The real differences between 1688, Alibaba and AliExpress for buyers in Nigeria: prices, minimum orders, payment, shipping and which one suits retail, reselling or bulk.",
    keywords: ["1688 vs Alibaba", "1688 vs AliExpress", "Alibaba vs AliExpress Nigeria", "cheapest Chinese website", "which China website is best"],
    topic: "Buying guides",
    published: "2026-11-18",
    updated: "2026-11-18",
    summary: "1688 is cheapest but domestic-only; Alibaba is for export bulk orders with minimums; AliExpress ships single items internationally at higher prices. Platforms like FastChina bring 1688 prices to Nigeria in naira.",
    sections: [
      {
        h: "The quick comparison",
        blocks: [
          { table: {
            head: ["", "1688", "Alibaba.com", "AliExpress"],
            rows: [
              ["Who it's for", "Buyers inside China", "International bulk buyers", "International shoppers"],
              ["Prices", "Lowest (domestic wholesale)", "Export wholesale", "Retail"],
              ["Minimum order", "Often 1–2 pieces", "Often 50–1,000 pieces", "1 piece"],
              ["Language", "Chinese", "English", "English"],
              ["Ships to Nigeria", "No", "Via your forwarder", "Yes, slow and costly"],
              ["Payment", "Alipay / Chinese bank", "Card, transfer", "Card"],
            ],
          } },
        ],
      },
      {
        h: "Which should you choose?",
        blocks: [
          { list: [
            "**Buying for yourself:** a naira platform with free shipping saves the most hassle. AliExpress works but delivery to Nigeria is unreliable.",
            "**Reselling in small quantities:** 1688 prices through a platform or agent give you the most margin.",
            "**Private label or custom products:** Alibaba.com suppliers are set up for logos, custom packaging and big runs.",
          ] },
          "Read [how to buy from 1688 in Nigeria](/guides/how-to-buy-from-1688-in-nigeria) for the practical steps.",
        ],
      },
    ],
    faqs: [
      { q: "Is 1688 the same company as Alibaba?", a: "Yes. 1688.com, Alibaba.com and AliExpress are all owned by Alibaba Group, but each serves a different kind of buyer." },
      { q: "Why is 1688 cheaper than Alibaba?", a: "1688 sellers price for Chinese domestic buyers and don't pay for export services, English support or international marketing." },
    ],
    cta: { title: "Get 1688 prices without the hassle", text: "Pay in naira. Free delivery to your Jumia pickup station.", label: "Browse products", href: "/" },
  },

  {
    slug: "best-products-to-import-from-china-to-nigeria",
    title: "Best Products to Import from China and Sell in Nigeria",
    h1: "The best products to import from China and sell in Nigeria",
    description: "Profitable products to import from China and resell in Nigeria in 2026: what sells, why, typical margins, and how to test a product before buying in bulk.",
    keywords: ["best products to import from China to Nigeria", "profitable products to import from China", "what to sell in Nigeria", "best things to resell in Nigeria", "products to dropship in Nigeria"],
    topic: "Buying guides",
    published: "2026-11-18",
    updated: "2026-11-18",
    summary: "The best products to import are light, in steady demand and hard to find cheaply in local markets: wigs, beauty tools, phone accessories, watches, fashion and small home gadgets.",
    sections: [
      {
        h: "What makes a product worth importing",
        blocks: [
          { list: [
            "**Light.** Under 500g keeps air freight low.",
            "**Not fragile.** Fewer breakages, fewer refunds.",
            "**Easy to explain in a photo or short video.**",
            "**A clear markup gap.** Your landed cost should be well under the local market price.",
            "**Repeat demand.** Hair, beauty and accessories are bought again and again.",
          ] },
        ],
      },
      {
        h: "Categories that sell well in Nigeria",
        blocks: [
          { table: {
            head: ["Category", "Why it works", "Shop it"],
            rows: [
              ["Wigs and bundles", "High value, light, constant demand", "[Hair & wigs](/category/hair)"],
              ["Beauty tools and lashes", "Cheap to ship, repeat buyers", "[Beauty](/category/beauty)"],
              ["Earbuds and chargers", "Everyone needs them, easy upsell", "[Accessories](/category/audio)"],
              ["Watches and jewellery", "Tiny parcels, gift buying", "[Watches](/category/jewellery)"],
              ["Dresses and sets", "Owambe and trend-driven", "[Fashion](/category/fashion)"],
              ["Small home gadgets", "Viral on TikTok and WhatsApp", "[Home](/category/home)"],
            ],
          } },
        ],
      },
      {
        h: "Test before you stock",
        blocks: [
          "Before buying 100 pieces, list the product in a [free dropship store](/guides/how-to-start-dropshipping-in-nigeria-for-free) or buy 10 at the retailer price. Post it for a week. If people ask about price and delivery without being pushed, it's a winner. Reorder in bulk only after that.",
        ],
      },
    ],
    faqs: [
      { q: "What is the most profitable thing to import from China?", a: "It changes with trends, but light, high-value items such as wigs, beauty tools, watches and phone accessories consistently leave good margins after air freight." },
      { q: "What should I avoid importing?", a: "Counterfeit brands, anything on the Nigeria Customs prohibition list, fragile glass and very heavy low-value items that cost more to ship than they're worth." },
    ],
    cta: { title: "Find your next best-seller", text: "See what's trending and buy 10+ at the retailer price.", label: "Open the wholesale market", href: "/wholesale" },
  },

  {
    slug: "how-to-avoid-scams-when-buying-from-china",
    title: "How to Avoid Scams When Buying from China (Nigeria)",
    h1: "How to avoid scams when buying from China",
    description: "The common scams Nigerians face when importing from China, from fake agents to wrong goods, and the simple checks that protect your money.",
    keywords: ["avoid scams buying from China", "China agent scam Nigeria", "is buying from China safe", "trusted China agent Nigeria", "safe way to import from China"],
    topic: "Importing",
    published: "2026-11-18",
    updated: "2026-11-18",
    summary: "Most import losses come from paying unverified agents, receiving goods that don't match the listing, or hidden freight charges. Use platforms with photo checks, fixed delivered prices and clear refund rules.",
    sections: [
      {
        h: "The most common scams",
        blocks: [
          { list: [
            "**Fake agents** who take payment then disappear, often via social media.",
            "**Bait listings** with photos of a better product than what's shipped.",
            "**Hidden charges** at the warehouse or port: \"your goods are held, pay ₦X to release\".",
            "**Weight inflation**, where you're billed for more kilograms than you shipped.",
          ] },
        ],
      },
      {
        h: "Checks that protect you",
        blocks: [
          { steps: [
            ["Pay a business, not a person", "Use platforms or registered companies with a website, terms and a refund policy."],
            ["Ask for a warehouse photo", "Insist on a photo of your exact item at the China warehouse before it ships. FastChina photographs every order."],
            ["Get the delivered price upfront", "Freight and clearing should be in the price or quoted in writing before you pay."],
            ["Track it", "You should be able to see where your order is at each stage."],
            ["Start small", "Test a supplier with a small order before a big one."],
          ] },
        ],
      },
    ],
    faqs: [
      { q: "Is it safe to buy from China?", a: "Yes, when you buy through a platform with fixed delivered prices, photo checks and a refund policy. Most losses come from paying unverified individuals." },
      { q: "What if my item arrives wrong or damaged?", a: "On FastChina, wrong or damaged items are refunded under our refund policy. Report it from your account after collection." },
    ],
    cta: { title: "Shop with photo checks", text: "Every order is photographed in China before it ships. Delivered or refunded.", label: "Shop safely", href: "/" },
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);

/** Rough reading time at 220 words a minute. */
export function readMinutes(g: Guide): number {
  const text = [g.summary, ...g.sections.flatMap((s) => s.blocks.map((b) => JSON.stringify(b))), ...g.faqs.map((f) => f.q + f.a)].join(" ");
  return Math.max(2, Math.round(text.split(/\s+/).length / 220));
}
