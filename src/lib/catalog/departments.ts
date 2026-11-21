import { audienceOf } from "./audience";
import type { IconKey, Product } from "./types";

/** A circle on a department page: a group of products, found by category and/or name. */
export interface SubGroup {
  slug: string;
  label: string;
  icon: IconKey;
  categories?: string[];
  /** Product name must match this (case-insensitive). */
  name?: RegExp;
}

export interface Department {
  slug: string;
  label: string;
  title: string;
  intro: string;
  /** Who it's for: limits shared categories (clothes, shoes, jewellery) to men's or women's items. */
  audience?: "men" | "women";
  categories: string[];
  subs: SubGroup[];
}

const PERFUME = /perfume|parfum|toilette|fragrance|cologne/i;

export const DEPARTMENTS_LIST: Department[] = [
  {
    slug: "women", label: "Women", title: "Women", intro: "Dresses, bags, shoes, jewellery and beauty, shipped free to your pickup station.", audience: "women",
    categories: ["fashion", "bags", "shoes", "jewellery", "beauty", "hair"],
    subs: [
      { slug: "dresses", label: "Dresses", icon: "dress", categories: ["fashion"], name: /dress|gown|skirt/i },
      { slug: "tops", label: "Tops", icon: "shirt", categories: ["fashion"], name: /top|blouse|shirt|tee/i },
      { slug: "bags", label: "Bags", icon: "bag", categories: ["bags"] },
      { slug: "shoes", label: "Shoes", icon: "shoe", categories: ["shoes"] },
      { slug: "jewellery", label: "Jewellery", icon: "gem", categories: ["jewellery"], name: /necklace|earring|bracelet|ring|jewel/i },
      { slug: "watches", label: "Watches", icon: "watch", categories: ["jewellery"], name: /watch/i },
      { slug: "perfume", label: "Perfume", icon: "lipstick", categories: ["beauty"], name: PERFUME },
      { slug: "makeup", label: "Makeup", icon: "lipstick", categories: ["beauty"], name: /lip|gloss|lash|nail|makeup|mascara|foundation/i },
      { slug: "wigs", label: "Wigs", icon: "wig", categories: ["hair"] },
    ],
  },
  {
    slug: "men", label: "Men", title: "Men", intro: "Polos, jackets, trousers, sneakers, watches and perfume for men.", audience: "men",
    categories: ["fashion", "shoes", "jewellery", "beauty", "bags"],
    subs: [
      { slug: "polos", label: "Polos & tees", icon: "shirt", categories: ["fashion"], name: /polo|t-?shirt|tee\b/i },
      { slug: "jackets", label: "Jackets", icon: "shirt", categories: ["fashion"], name: /jacket|coat|vest|bomber|hoodie/i },
      { slug: "trousers", label: "Trousers", icon: "shirt", categories: ["fashion"], name: /pant|trouser|chino|jean|jogger|cargo|short/i },
      { slug: "sneakers", label: "Sneakers", icon: "shoe", categories: ["shoes"], name: /sneaker|trainer|canvas|running|walking/i },
      { slug: "slides", label: "Slides & sandals", icon: "shoe", categories: ["shoes"], name: /slide|sandal|slipper|flip/i },
      { slug: "watches", label: "Watches", icon: "watch", categories: ["jewellery"], name: /watch/i },
      { slug: "chains", label: "Chains & rings", icon: "gem", categories: ["jewellery"], name: /chain|necklace|bracelet|ring|pendant/i },
      { slug: "perfume", label: "Perfume", icon: "lipstick", categories: ["beauty"], name: PERFUME },
    ],
  },
  {
    slug: "phones", label: "Phones", title: "Phones & accessories", intro: "Phones, cases, earbuds and everything that plugs in.",
    categories: ["gadgets", "audio"],
    subs: [
      { slug: "phones", label: "Phones", icon: "phone", categories: ["gadgets"], name: /phone|smartphone/i },
      { slug: "cases", label: "Phone cases", icon: "phone", categories: ["audio", "gadgets"], name: /case|cover/i },
      { slug: "earbuds", label: "Earbuds", icon: "audio", categories: ["audio"], name: /earbud|earphone|headphone|tws|headset/i },
      { slug: "laptops", label: "Laptops", icon: "laptop", categories: ["gadgets"], name: /laptop|notebook/i },
      { slug: "gadgets", label: "Gadgets", icon: "drone", categories: ["gadgets"] },
    ],
  },
  {
    slug: "hair", label: "Hair", title: "Hair & wigs", intro: "Human hair wigs, bundles and closures.",
    categories: ["hair"],
    subs: [
      { slug: "wigs", label: "Wigs", icon: "wig", categories: ["hair"], name: /wig/i },
      { slug: "bob", label: "Bob wigs", icon: "wig", categories: ["hair"], name: /bob/i },
      { slug: "lace", label: "Lace front", icon: "wig", categories: ["hair"], name: /lace|frontal|closure/i },
      { slug: "bundles", label: "Bundles", icon: "wig", categories: ["hair"], name: /bundle|weave|extension/i },
    ],
  },
  {
    slug: "beauty", label: "Beauty", title: "Beauty", intro: "Lipstick, perfume, lashes and skincare.",
    categories: ["beauty"],
    subs: [
      { slug: "perfume", label: "Perfume", icon: "lipstick", name: PERFUME },
      { slug: "lips", label: "Lips", icon: "lipstick", name: /lip|gloss/i },
      { slug: "lashes", label: "Lashes & nails", icon: "lipstick", name: /lash|nail/i },
      { slug: "skin", label: "Skincare", icon: "lipstick", name: /cream|serum|skin|lotion|soap|mask/i },
    ],
  },
  {
    slug: "home", label: "Home", title: "Home & kitchen", intro: "Kitchen helpers, small appliances and things for the house.",
    categories: ["home", "kids"],
    subs: [
      { slug: "kitchen", label: "Kitchen", icon: "home", categories: ["home"], name: /kitchen|chop|blend|cook|knife|pot|pan|cup|bottle/i },
      { slug: "appliances", label: "Appliances", icon: "home", categories: ["home"], name: /electric|machine|blender|fan|light|lamp/i },
      { slug: "kids", label: "Kids & baby", icon: "kids", categories: ["kids"] },
      { slug: "home", label: "Everything home", icon: "home", categories: ["home"] },
    ],
  },
  {
    slug: "sea", label: "Sea items", title: "Big items by sea", intro: "Furniture and machines, shipped by sea in about 90 days.",
    categories: ["furniture", "machines"],
    subs: [
      { slug: "furniture", label: "Furniture", icon: "sofa", categories: ["furniture"] },
      { slug: "machines", label: "Machines", icon: "machine", categories: ["machines"] },
    ],
  },
];

export const departmentBySlug = (slug: string) => DEPARTMENTS_LIST.find((d) => d.slug === slug);

/** Everything in a department, best sellers first. */
export function departmentProducts(d: Department, products: Product[]): Product[] {
  return products
    .filter((p) => d.categories.includes(p.category))
    .filter((p) => {
      if (!d.audience) return true;
      // Beauty and hair aren't split by name unless the name says who it's for.
      const a = audienceOf(p);
      return a === "all" || a === d.audience;
    })
    .sort((a, b) => b.sold - a.sold);
}

export const inSub = (s: SubGroup, p: Product) => (!s.categories || s.categories.includes(p.category)) && (!s.name || s.name.test(p.name));

/** The circles to show: only groups that have products, each with a real product photo. */
export function departmentCircles(d: Department, products: Product[]) {
  return d.subs
    .map((s) => {
      const list = products.filter((p) => inSub(s, p));
      return { ...s, count: list.length, image: list.find((p) => p.images[0])?.images[0] ?? null };
    })
    .filter((s) => s.count > 0);
}
