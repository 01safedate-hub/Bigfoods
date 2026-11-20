import type { Product } from "./types";

const MEN = /\b(men|mens|men's|male|boys?|gentlem[ae]n)\b/i;
const WOMEN = /\b(women|womens|women's|ladies|lady|female|girls?)\b/i;

/** Who a product is for, read from its name: "men", "women", or "all" when it doesn't say (or says both). */
export function audienceOf(p: Pick<Product, "name">): "men" | "women" | "all" {
  const m = MEN.test(p.name);
  const w = WOMEN.test(p.name);
  return m && !w ? "men" : w && !m ? "women" : "all";
}

/** Men's department: men's clothing, shoes and jewellery, plus unisex ones. Women's: the same idea. */
export function inDepartment(p: Product, dept: "men" | "women") {
  const cats = dept === "men" ? ["fashion", "jewellery", "shoes"] : ["fashion", "bags", "jewellery", "shoes"];
  if (!cats.includes(p.category)) return false;
  const a = audienceOf(p);
  return a === dept || a === "all";
}
