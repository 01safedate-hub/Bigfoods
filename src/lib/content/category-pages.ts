import type { CategoryKey } from "@/lib/pricing/engine";

/**
 * Landing page copy for each category (/category/[slug]). Written for the searches Nigerians make
 * ("buy wigs from China", "cheap phones from China in Nigeria"), and kept honest: every claim
 * here matches how checkout, delivery and pricing actually work.
 */
export interface CategoryPage {
  name: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  faqs: { q: string; a: string }[];
  guides: string[];
}

const AIR = "Ships by air in about 10–18 days, free to your Jumia pickup station.";
const SEA = "Ships by sea in 90 days or more, because big items are too heavy for air. Delivery to your pickup station is still free.";

export const CATEGORY_PAGES: Record<CategoryKey, CategoryPage> = {
  gadgets: {
    name: "Phones & Gadgets",
    title: "Buy Phones & Gadgets from China in Nigeria",
    h1: "Phones and gadgets from China, priced in Naira",
    description: "Android phones, laptops, tablets, drones and smart watches from China's factories at factory prices, with free delivery in Nigeria and Pay small small over up to 12 weeks.",
    intro: `Phones, laptops, tablets, drones and smart watches bought straight from Chinese suppliers. Gadget prices carry a fixed 10% margin plus a flat fee instead of a percentage mark-up, so expensive devices stay close to their factory price. ${AIR} Spread the cost with Pay small small over 4, 8 or 12 weeks at 0% interest.`,
    faqs: [
      { q: "Are the phones new and original?", a: "Every listing states the brand, model and condition from the supplier. Each order is photographed at our China warehouse before it ships, so you can see your exact item first." },
      { q: "Can I pay for a phone in instalments?", a: "Yes. Pay small small splits the price into weekly payments over 4, 8 or 12 weeks with 0% interest. We buy the phone once it is fully paid." },
      { q: "How long does a gadget take to arrive?", a: "Gadgets ship by air and usually arrive at your Jumia pickup station 10–18 days after full payment." },
    ],
    guides: ["how-to-import-from-china-to-nigeria", "shipping-from-china-to-nigeria-cost"],
  },
  fashion: {
    name: "Fashion",
    title: "Women & Men Clothing from China, Delivered in Nigeria",
    h1: "Clothes from China at factory prices",
    description: "Dresses, two-piece sets, tops, tees and menswear from China’s factories. Prices in Naira, free shipping to your Jumia pickup station, retailer prices from 10 pieces.",
    intro: `Dresses, sets, tops and menswear from the same Guangzhou and Hangzhou factories that supply market traders. Pick your colour and size on each product. ${AIR} Buying for resale? Order 10 or more of any item and the retailer price applies automatically.`,
    faqs: [
      { q: "How do I choose the right size?", a: "Each product lists its sizes and measurements from the supplier. Chinese sizes often run one size small, so compare the measurements with a piece you own." },
      { q: "Can I buy clothes in bulk to resell?", a: "Yes. Add 10 or more of any item and the retailer price applies at checkout, up to 40% off our profit. See the wholesale market for more." },
      { q: "Is shipping free on clothes?", a: "Yes, shipping to any Jumia pickup station in Nigeria is included in the price." },
    ],
    guides: ["best-products-to-import-from-china-to-nigeria", "how-to-start-dropshipping-in-nigeria-for-free"],
  },
  hair: {
    name: "Hair & Wigs",
    title: "Buy Wigs & Human Hair from China in Nigeria",
    h1: "Wigs, bundles and bone straight hair from China",
    description: "Lace front wigs, bone straight, curly wigs and bundles from Chinese hair factories at factory prices. Free delivery to your Jumia pickup station anywhere in Nigeria.",
    intro: `Lace fronts, closures, bone straight and curly units from the hair factories in Xuchang and Guangzhou that supply salons worldwide. Each listing gives the hair type, length and lace size from the supplier. ${AIR} Salon owners get the retailer price from 10 units.`,
    faqs: [
      { q: "Is the hair human hair or synthetic?", a: "Each wig states its hair type from the supplier: human, human-blend or heat-resistant fibre. If it isn't clear, ask on the product page and our team answers." },
      { q: "Can salons buy wigs wholesale?", a: "Yes. Order 10 or more of any wig or bundle and the retailer price applies automatically." },
      { q: "How long does hair take to deliver?", a: "Hair ships by air and usually arrives in 10–18 days." },
    ],
    guides: ["best-products-to-import-from-china-to-nigeria", "how-to-import-from-china-to-nigeria"],
  },
  beauty: {
    name: "Beauty",
    title: "Beauty & Makeup from China, Shipped Free in Nigeria",
    h1: "Beauty and makeup from China's factories",
    description: "Lipsticks, lashes, nails, skincare tools and beauty accessories from Chinese manufacturers at Naira prices with free delivery to Jumia pickup stations.",
    intro: `Makeup, lashes, press-on nails and beauty tools from Chinese manufacturers. ${AIR}`,
    faqs: [
      { q: "How long does makeup take to arrive?", a: "Beauty items ship by air and usually reach your Jumia pickup station 10–18 days after full payment." },
      { q: "Do you sell for makeup artists and shops?", a: "Yes. From 10 units of an item you pay the retailer price." },
    ],
    guides: ["best-products-to-import-from-china-to-nigeria", "how-to-avoid-scams-when-buying-from-china"],
  },
  jewellery: {
    name: "Jewellery & Watches",
    title: "Watches & Jewellery from China in Nigeria",
    h1: "Watches and jewellery from China",
    description: "Quartz watches, chains, necklaces, rings and earrings from Yiwu and Guangzhou suppliers at factory prices, delivered free across Nigeria.",
    intro: `Men's and women's watches, chains, rings and earrings from the Yiwu and Guangzhou markets. Small, light items like these are the cheapest to ship, so prices stay low. ${AIR}`,
    faqs: [
      { q: "Is the jewellery gold?", a: "Listings state the material from the supplier, such as stainless steel, alloy or gold-plated. Solid gold is rarely sold this way." },
      { q: "Can I resell watches?", a: "Yes. Order 10 or more of any item for the retailer price, or add them to your own dropship store." },
    ],
    guides: ["best-products-to-import-from-china-to-nigeria", "how-to-start-dropshipping-in-nigeria-for-free"],
  },
  audio: {
    name: "Phone accessories & Audio",
    title: "Earbuds, Chargers & Phone Accessories from China",
    h1: "Earbuds, chargers and phone accessories",
    description: "Wireless earbuds, chargers, cables, power banks and phone cases from Shenzhen factories at factory prices with free delivery in Nigeria.",
    intro: `Earbuds, speakers, chargers, cables and cases from Shenzhen, the world's electronics market. ${AIR}`,
    faqs: [
      { q: "How long do accessories take to arrive?", a: "They ship by air and usually arrive in 10–18 days, free to your Jumia pickup station." },
      { q: "Do accessories come with a warranty?", a: "Every item is checked and photographed at our warehouse. If it arrives faulty or wrong, our refund policy covers it." },
    ],
    guides: ["how-to-import-from-china-to-nigeria", "shipping-from-china-to-nigeria-cost"],
  },
  shoes: {
    name: "Shoes",
    title: "Sneakers, Slides & Shoes from China in Nigeria",
    h1: "Shoes from China at factory prices",
    description: "Sneakers, slides, heels and men's shoes from Putian and Guangzhou factories. Naira prices, free delivery to your Jumia pickup station.",
    intro: `Sneakers, slides, heels and formal shoes from Chinese factories. Check the size chart on each product: Chinese sizes are listed in EU numbers. ${AIR}`,
    faqs: [
      { q: "What shoe sizes do you use?", a: "Most suppliers use EU sizes (for example 42). Each product lists its size range and foot length." },
      { q: "Can I buy shoes in bulk?", a: "Yes. From 10 pairs of an item you pay the retailer price." },
    ],
    guides: ["best-products-to-import-from-china-to-nigeria", "how-to-buy-wholesale-from-china"],
  },
  bags: {
    name: "Bags",
    title: "Handbags & Bags from China, Delivered in Nigeria",
    h1: "Handbags, crossbody bags and backpacks",
    description: "Handbags, crossbody bags, totes and backpacks from Guangzhou's Baiyun leather market at factory prices, free shipping in Nigeria.",
    intro: `Handbags, totes, crossbody bags and backpacks from the leather goods suppliers around Guangzhou. ${AIR}`,
    faqs: [
      { q: "Are the bags leather?", a: "Each listing states the material from the supplier, usually PU leather, genuine leather or canvas." },
      { q: "Can I order bags for my shop?", a: "Yes. 10 or more of any bag gets the retailer price." },
    ],
    guides: ["best-products-to-import-from-china-to-nigeria", "how-to-start-dropshipping-in-nigeria-for-free"],
  },
  home: {
    name: "Home & Kitchen",
    title: "Home & Kitchen Items from China in Nigeria",
    h1: "Home and kitchen essentials from China",
    description: "Kitchen tools, small appliances, storage, décor and bedding from Chinese factories at factory prices, delivered free to your Jumia pickup station.",
    intro: `Kitchen tools, storage, décor, bedding and small appliances from Yiwu and Guangdong. ${AIR}`,
    faqs: [
      { q: "Will appliances work with Nigerian power?", a: "Check the voltage on the product page. Most appliances we list are 220–240V. Plugs may need an adapter." },
      { q: "What about big items like furniture?", a: "Furniture and other large items ship by sea in 90 days or more. You'll find them under Furniture." },
    ],
    guides: ["shipping-from-china-to-nigeria-cost", "how-to-import-from-china-to-nigeria"],
  },
  kids: {
    name: "Kids & Baby",
    title: "Kids & Baby Products from China in Nigeria",
    h1: "Kids' clothes, toys and baby essentials",
    description: "Children's clothing, toys and baby accessories from Chinese factories with Naira prices and free delivery to Jumia pickup stations in Nigeria.",
    intro: `Children's clothes, toys and baby accessories from Chinese manufacturers. ${AIR}`,
    faqs: [
      { q: "Are the toys safe?", a: "Listings state age ranges and materials from the supplier. We check each item at our warehouse before it ships." },
      { q: "How do kids' sizes work?", a: "Sizes are usually by height in centimetres. Each product lists them." },
    ],
    guides: ["best-products-to-import-from-china-to-nigeria"],
  },
  furniture: {
    name: "Furniture",
    title: "Buy Furniture from China, Shipped by Sea to Nigeria",
    h1: "Furniture from Foshan's factories",
    description: "Sofas, chairs, tables and beds from Foshan, China's furniture capital, shipped by sea to Nigeria with free delivery to your pickup station.",
    intro: `Sofas, dining sets, chairs and beds from Foshan, where much of the world's furniture is made. ${SEA} Ordering a full room or a container? Our wholesale sea freight service handles that.`,
    faqs: [
      { q: "How long does furniture take from China?", a: "Furniture ships by sea and takes 90 days or more from full payment." },
      { q: "Can I ship a full container of furniture?", a: "Yes. Use wholesale sea freight on FastChina.store: your goods are received at our China address and shipped by the cubic metre." },
    ],
    guides: ["shipping-from-china-to-nigeria-cost", "how-to-buy-wholesale-from-china"],
  },
  machines: {
    name: "Machines",
    title: "Industrial & Business Machines from China to Nigeria",
    h1: "Machines from China for your business",
    description: "Small-business and industrial machines from Chinese manufacturers, shipped by sea to Nigeria. Prices in Naira with clearing included.",
    intro: `Production, packaging, food-processing and printing machines for small businesses. ${SEA} Clearing is included in the price, so there are no surprise charges at the port.`,
    faqs: [
      { q: "Is customs clearing included?", a: "Yes. Clearing is built into every price, so you don't pay extra at the port." },
      { q: "Will the machine work on Nigerian power?", a: "Check the voltage and phase on the product page, or ask a question before you buy and our team will confirm with the factory." },
    ],
    guides: ["how-to-import-from-china-to-nigeria", "how-to-buy-wholesale-from-china"],
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_PAGES) as CategoryKey[];
