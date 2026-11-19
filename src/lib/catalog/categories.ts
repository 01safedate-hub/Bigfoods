import type { Category } from "./types";

export const DEPARTMENTS = ["All", "Women", "Men", "Phones", "Hair", "Beauty", "Home", "Sea items"] as const;

export const CATEGORIES: Category[] = [
  {
    slug: "for-you", name: "Just for You", icon: "gift", tint: "#F6E3E6",
    tiles: [
      { name: "Men quartz watches", icon: "watch", tint: "#E3EEE8" }, { name: "Lace front wigs", icon: "wig", tint: "#F3E9DC" },
      { name: "Chain necklaces", icon: "gem", tint: "#ECECEC" }, { name: "Android phones", icon: "phone", tint: "#E8E8F0" },
      { name: "Oversized tees", icon: "shirt", tint: "#EAF0F7" }, { name: "Satin dresses", icon: "dress", tint: "#F6E3E6" },
      { name: "Earbuds", icon: "audio", tint: "#E7E6F3" }, { name: "Sneakers", icon: "shoe", tint: "#F0ECE4" },
      { name: "Crossbody bags", icon: "bag", tint: "#F7E6EC" },
    ],
  },
  {
    slug: "gadgets", name: "Phones & Gadgets", icon: "phone", tint: "#E8E8F0",
    note: { text: "Gadgets ship by air in 10+ days. Pay small small over up to 12 weeks.", tone: "plain" },
    tiles: [
      { name: "Android phones", icon: "phone", tint: "#E8E8F0" }, { name: "Laptops", icon: "laptop", tint: "#E6ECF2" },
      { name: "Drones", icon: "drone", tint: "#E3EEE8" }, { name: "Smart watches", icon: "watch", tint: "#E7E6F3" },
      { name: "Earbuds", icon: "audio", tint: "#E7E6F3" }, { name: "Tablets", icon: "phone", tint: "#EEF0F4" },
    ],
  },
  {
    slug: "hair", name: "Hair & Wigs", icon: "wig", tint: "#F3E9DC",
    tiles: [
      { name: "Lace front wigs", icon: "wig", tint: "#F3E9DC" }, { name: "Bone straight", icon: "wig", tint: "#F1E4D6" },
      { name: "Curly wigs", icon: "wig", tint: "#F5EBDD" }, { name: "Bundles", icon: "wig", tint: "#EFE3D3" },
    ],
  },
  {
    slug: "women", name: "Women Clothing", icon: "dress", tint: "#F6E3E6",
    tiles: [
      { name: "Dresses", icon: "dress", tint: "#F6E3E6" }, { name: "Tops", icon: "shirt", tint: "#EAF0F7" },
      { name: "Two-piece sets", icon: "dress", tint: "#EFE7F3" }, { name: "Bags", icon: "bag", tint: "#F7E6EC" },
    ],
  },
  {
    slug: "men", name: "Men Clothing", icon: "shirt", tint: "#EAF0F7",
    tiles: [
      { name: "T-shirts", icon: "shirt", tint: "#EAF0F7" }, { name: "Watches", icon: "watch", tint: "#E3EEE8" },
      { name: "Chains", icon: "gem", tint: "#ECECEC" }, { name: "Sneakers", icon: "shoe", tint: "#F0ECE4" },
    ],
  },
  { slug: "shoes", name: "Shoes", icon: "shoe", tint: "#F0ECE4", tiles: [{ name: "Sneakers", icon: "shoe", tint: "#F0ECE4" }, { name: "Slides", icon: "shoe", tint: "#F2ECE3" }] },
  { slug: "bags", name: "Bags", icon: "bag", tint: "#F7E6EC", tiles: [{ name: "Crossbody", icon: "bag", tint: "#F7E6EC" }, { name: "Totes", icon: "bag", tint: "#F1EBDD" }] },
  { slug: "jewellery", name: "Jewellery & Watches", icon: "gem", tint: "#ECECEC", tiles: [{ name: "Necklaces", icon: "gem", tint: "#ECECEC" }, { name: "Watches", icon: "watch", tint: "#E3EEE8" }] },
  { slug: "beauty", name: "Beauty", icon: "lipstick", tint: "#F8E1E7", tiles: [{ name: "Lipstick", icon: "lipstick", tint: "#F8E1E7" }, { name: "Nails", icon: "lipstick", tint: "#F2E4E8" }] },
  { slug: "home", name: "Home & Kitchen", icon: "home", tint: "#EDF0E3", tiles: [{ name: "Blenders", icon: "home", tint: "#EDF0E3" }, { name: "Cookware", icon: "home", tint: "#EEF0E2" }] },
  { slug: "kids", name: "Kids & Baby", icon: "kids", tint: "#E6EEF6", tiles: [{ name: "Kids’ sets", icon: "kids", tint: "#E6EEF6" }, { name: "Toys", icon: "gift", tint: "#F1EADB" }] },
  {
    slug: "furniture", name: "Furniture · Sea", icon: "sofa", tint: "#ECECEC",
    note: { text: "Big items ship by sea only and arrive in 90+ days. Sea freight and clearing are included in the price.", tone: "sea" },
    tiles: [
      { name: "Office chairs", icon: "chair", tint: "#ECECEC" }, { name: "Dining tables", icon: "table", tint: "#F1EBDD" },
      { name: "Sofas", icon: "sofa", tint: "#EEF0F4" },
    ],
  },
  {
    slug: "machines", name: "Machines · Sea", icon: "machine", tint: "#E9ECEF",
    note: { text: "Machines ship by sea only and arrive in 90+ days. Sea freight and clearing are included in the price.", tone: "sea" },
    tiles: [{ name: "Sewing machines", icon: "machine", tint: "#E9ECEF" }, { name: "Generators", icon: "machine", tint: "#ECECEC" }],
  },
  {
    slug: "retailer", name: "Wholesale market", icon: "gift", tint: "#F6F1E4",
    note: { text: "Stock for your shop from 10 units per product, shipped by sea with delivery included. Open the wholesale market for starter kits and wholesale prices.", tone: "retail" },
    tiles: [
      { name: "Phone accessories", icon: "audio", tint: "#E7E6F3" }, { name: "Watches", icon: "watch", tint: "#E3EEE8" },
      { name: "Wigs", icon: "wig", tint: "#F3E9DC" }, { name: "Cosmetics", icon: "lipstick", tint: "#F8E1E7" },
    ],
  },
];
