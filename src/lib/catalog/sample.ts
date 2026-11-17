import type { SampleProduct } from "./types";

/**
 * Sample catalogue. In production this comes from the `products` table, filled by the
 * 1688 import edge function. Costs are 1688 prices in yuan; every naira price is
 * calculated by the pricing engine, never stored by hand.
 */
export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    slug: "amoled-android-phone-5g", name: '6.7" AMOLED Android phone, 5G, 50MP triple camera', category: "gadgets", cny: 620, weightKg: 0.45,
    description: "Dual nano-SIM 5G phone with a 6.7-inch 120Hz AMOLED screen, 5000mAh battery and 33W fast charging.",
    rating: 4.7, reviews: 812, sold: 3100, tint: "#E8E8F0", icon: "phone", badge: "Gadget",
    colors: [{ name: "Midnight Black", hex: "#1B1B1F" }, { name: "Glacier Blue", hex: "#9CB8D6" }, { name: "Sage Green", hex: "#9DB59A" }],
    options: [{ label: "128GB", cny: 540 }, { label: "256GB", cny: 620 }, { label: "512GB", cny: 760 }],
    specs: [["Shipping weight", "0.45 kg"], ["Ships by", "Air only"], ["In the box", "Phone, 33W charger, USB-C cable, case"], ["Networks", "2G / 3G / 4G / 5G"]],
    qa: [
      { q: "Does it work on MTN and Airtel 5G?", who: "Kunle · 3 days ago", a: "Yes. It supports the 5G band used in Nigeria and all 4G networks.", by: "FastChina team · Product specialist" },
      { q: "Can I pay small small and still get it before Christmas?", who: "Ifeoma · 1 week ago", a: "Yes, if your last payment clears by 10 December. We order it from the factory once it’s fully paid.", by: "FastChina team · Customer care" },
    ],
  },
  {
    slug: "satin-cowl-neck-midi-dress", name: "Satin cowl-neck midi dress with side slit", category: "fashion", cny: 28, weightKg: 0.3,
    description: "Fluid satin midi with a draped cowl neck and thigh slit. Lined bodice.", rating: 4.8, reviews: 2140, sold: 12400, tint: "#F6E3E6", icon: "dress", badge: "Trending",
    colors: [{ name: "Wine", hex: "#6B1E2E" }, { name: "Black", hex: "#141414" }, { name: "Champagne", hex: "#E6CFA8" }], sizes: ["XS", "S", "M", "L", "XL"],
    specs: [["Material", "Polyester satin"], ["Shipping weight", "0.3 kg"], ["Ships by", "Air"]], flash: { claimedPct: 64 },
  },
  {
    slug: "body-wave-lace-front-wig-22", name: 'Body wave lace front wig, 22", 180% density', category: "hair", cny: 145, weightKg: 0.4,
    description: "13×4 HD lace front, pre-plucked hairline, 100% human hair.", rating: 4.7, reviews: 1630, sold: 8400, tint: "#F3E9DC", icon: "wig", badge: "TOP 1 in Wigs",
    colors: [{ name: "Natural black", hex: "#1A1410" }], sizes: ['18"', '20"', '22"', '24"'],
    specs: [["Lace", "13×4 HD"], ["Density", "180%"], ["Shipping weight", "0.4 kg"]], flash: { claimedPct: 48 },
  },
  {
    slug: "mens-steel-quartz-watch", name: "Men’s steel band quartz watch, green dial", category: "jewellery", cny: 18, weightKg: 0.15,
    description: "Octagon case, luminous hands, date window, fold-over clasp.", rating: 4.8, reviews: 1000, sold: 25800, tint: "#E3EEE8", icon: "watch",
    colors: [{ name: "Green", hex: "#245C45" }, { name: "Blue", hex: "#23395B" }, { name: "Black", hex: "#141414" }],
    specs: [["Movement", "Quartz"], ["Water resistance", "Splash"], ["Shipping weight", "0.15 kg"]], flash: { claimedPct: 90 },
  },
  {
    slug: "wireless-earbuds-enc", name: "Wireless earbuds, ENC calls, 40h with case", category: "audio", cny: 22, weightKg: 0.12,
    description: "Bluetooth 5.4 earbuds with call noise cancelling and a 40-hour charging case.", rating: 4.5, reviews: 3300, sold: 21000, tint: "#E7E6F3", icon: "audio", isNew: true,
    colors: [{ name: "White", hex: "#F4F4F4" }, { name: "Black", hex: "#141414" }], specs: [["Battery", "40h with case"], ["Shipping weight", "0.12 kg"]], flash: { claimedPct: 71 },
  },
  {
    slug: "stainless-thorn-chain-necklace", name: "Stainless steel thorn chain necklace", category: "jewellery", cny: 6, weightKg: 0.05,
    description: "Tarnish-free 316L steel choker with thorn links.", rating: 4.6, reviews: 640, sold: 9900, tint: "#ECECEC", icon: "gem", isNew: true,
    specs: [["Material", "316L stainless steel"], ["Length", "45 cm"]],
  },
  {
    slug: "laptop-14-core-i7", name: '14" laptop, Core i7, 16GB RAM, 512GB SSD', category: "gadgets", cny: 2600, weightKg: 1.9,
    description: "Slim aluminium laptop with a 14-inch 2.2K screen and backlit keyboard.", rating: 4.6, reviews: 210, sold: 640, tint: "#E6ECF2", icon: "laptop", badge: "Gadget", isNew: true,
    specs: [["Screen", '14" 2.2K'], ["Shipping weight", "1.9 kg"], ["Ships by", "Air only"]],
  },
  {
    slug: "chunky-platform-sneakers", name: "Chunky platform sneakers, breathable mesh", category: "shoes", cny: 58, weightKg: 0.9,
    description: "Lightweight EVA sole, mesh upper, 5 cm lift.", rating: 4.6, reviews: 980, sold: 5100, tint: "#F0ECE4", icon: "shoe",
    colors: [{ name: "White", hex: "#F4F4F4" }, { name: "Beige", hex: "#D8C3A5" }], sizes: ["37", "38", "39", "40", "41", "42", "43"], specs: [["Shipping weight", "0.9 kg"]],
  },
  {
    slug: "ergonomic-mesh-office-chair", name: "Ergonomic mesh office chair with headrest", category: "furniture", cny: 260, weightKg: 18, cbm: 0.25,
    description: "Adjustable lumbar support, 3D armrests and 135° recline.", rating: 4.7, reviews: 290, sold: 1200, tint: "#ECECEC", icon: "chair",
    specs: [["Shipping weight", "18 kg"], ["Volume", "0.25 CBM"], ["Ships by", "Sea only · 90+ days"]],
  },
  {
    slug: "quilted-crossbody-chain-bag", name: "Quilted crossbody bag with chain strap", category: "bags", cny: 32, weightKg: 0.45,
    description: "Vegan leather, gold-tone hardware, magnetic flap.", rating: 4.8, reviews: 1500, sold: 9700, tint: "#F7E6EC", icon: "bag", isNew: true,
    colors: [{ name: "Black", hex: "#141414" }, { name: "Cream", hex: "#EDE3D1" }, { name: "Pink", hex: "#E8A2B4" }], specs: [["Shipping weight", "0.45 kg"]], flash: { claimedPct: 55 },
  },
  {
    slug: "foldable-4k-camera-drone", name: "Foldable 4K camera drone, 3 batteries", category: "gadgets", cny: 420, weightKg: 0.9,
    description: "GPS return-home, 4K gimbal camera, 3 batteries for about 75 minutes of flight.", rating: 4.5, reviews: 150, sold: 980, tint: "#E3EEE8", icon: "drone", badge: "Gadget", isNew: true,
    specs: [["Camera", "4K 2-axis gimbal"], ["Shipping weight", "0.9 kg"]],
  },
  {
    slug: "matte-liquid-lipstick-set", name: "Matte liquid lipstick set, 6 shades", category: "beauty", cny: 15, weightKg: 0.15,
    description: "Long-wear, transfer-resistant matte shades for deep and medium skin tones.", rating: 4.6, reviews: 2600, sold: 14000, tint: "#F8E1E7", icon: "lipstick",
    specs: [["Shades", "6"], ["Shipping weight", "0.15 kg"]], flash: { claimedPct: 77 },
  },
  {
    slug: "oversized-graphic-tee", name: "Oversized drop-shoulder graphic tee", category: "fashion", cny: 16, weightKg: 0.25,
    description: "Heavyweight 240gsm cotton.", rating: 4.7, reviews: 4100, sold: 30000, tint: "#EAF0F7", icon: "shirt", isNew: true,
    colors: [{ name: "White", hex: "#F4F4F4" }, { name: "Black", hex: "#141414" }, { name: "Olive", hex: "#3F6B4F" }], sizes: ["S", "M", "L", "XL", "XXL"], specs: [["Material", "100% cotton, 240gsm"]],
  },
  {
    slug: "mini-portable-blender", name: "Mini portable blender, USB-C, 380ml", category: "home", cny: 19, weightKg: 0.6,
    description: "Six stainless blades, rechargeable, BPA-free cup.", rating: 4.5, reviews: 1900, sold: 18000, tint: "#EDF0E3", icon: "home", specs: [["Capacity", "380 ml"], ["Shipping weight", "0.6 kg"]],
  },
  {
    slug: "bone-straight-hd-lace-wig-26", name: 'Bone straight HD lace wig, 26"', category: "hair", cny: 210, weightKg: 0.45,
    description: "Silky bone straight, HD lace, glueless fit.", rating: 4.6, reviews: 900, sold: 4400, tint: "#F1E4D6", icon: "wig", specs: [["Length", '26"'], ["Shipping weight", "0.45 kg"]],
  },
  {
    slug: "marble-top-dining-table", name: "Marble-top dining table, 6 seater", category: "furniture", cny: 980, weightKg: 75, cbm: 0.9,
    description: "Sintered stone top on a powder-coated steel base.", rating: 4.8, reviews: 60, sold: 210, tint: "#F1EBDD", icon: "table",
    specs: [["Shipping weight", "75 kg"], ["Volume", "0.9 CBM"], ["Ships by", "Sea only · 90+ days"]],
  },
  {
    slug: "industrial-lockstitch-sewing-machine", name: "Industrial lockstitch sewing machine", category: "machines", cny: 1350, weightKg: 55, cbm: 0.45,
    description: "Direct-drive servo motor, auto thread trimmer, table included.", rating: 4.6, reviews: 80, sold: 330, tint: "#E9ECEF", icon: "machine", badge: "Business",
    specs: [["Motor", "550W servo"], ["Shipping weight", "55 kg"], ["Ships by", "Sea only · 90+ days"]],
  },
  {
    slug: "kids-hoodie-jogger-set", name: "Kids’ hoodie and jogger set", category: "kids", cny: 24, weightKg: 0.4,
    description: "Brushed fleece two-piece, ages 3–10.", rating: 4.9, reviews: 700, sold: 7300, tint: "#E6EEF6", icon: "kids", sizes: ["3–4", "5–6", "7–8", "9–10"], specs: [["Shipping weight", "0.4 kg"]],
  },
];

export const sampleBySlug = (slug: string) => SAMPLE_PRODUCTS.find((p) => p.slug === slug);
