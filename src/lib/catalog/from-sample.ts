import { isGadget, priceOf, shipsBySea, type QuoteLine } from "@/lib/pricing/engine";
import { withVariantCost } from "./variant-cost";
import type { PriceSet, Product, ProductOption, SampleProduct, Variant } from "./types";

const pick = (b: PriceSet): PriceSet => ({ list: b.list, midnight: b.midnight, event: b.event, flash: b.flash, retailer: b.retailer });

export function sampleOptions(s: SampleProduct): ProductOption[] {
  return [
    ...(s.colors ? [{ name: "Colour", values: s.colors.map((c) => ({ label: c.name, hex: c.hex })) }] : []),
    ...(s.options ? [{ name: "Storage", values: s.options.map((o) => ({ label: o.label })) }] : []),
    ...(s.sizes ? [{ name: "Size", values: s.sizes.map((label) => ({ label })) }] : []),
  ];
}

/** Variant id = "Colour:Wine;Size:M", the same key the demo seed uses as source_sku_id. */
export const variantKey = (props: Record<string, string>) => Object.entries(props).map(([k, v]) => `${k}:${v}`).join(";") || "default";

export function sampleVariants(s: SampleProduct): Variant[] {
  let combos: Record<string, string>[] = [{}];
  for (const o of sampleOptions(s)) combos = combos.flatMap((c) => o.values.map((v) => ({ ...c, [o.name]: v.label })));
  return combos.map((props) => ({ id: variantKey(props), props, stock: 500, prices: pick(priceOf(withVariantCost(s, props))) }));
}

/** Public shape for a sample product. Costs stay on the server. */
export function sampleToProduct(s: SampleProduct): Product {
  const variants = sampleVariants(s);
  const min = (k: keyof PriceSet) => Math.min(...variants.map((v) => v.prices[k]));
  return {
    slug: s.slug,
    name: s.name,
    description: s.description,
    category: s.category,
    isGadget: isGadget(s),
    shipMode: shipsBySea(s) ? "sea" : "air",
    images: [],
    tint: s.tint,
    icon: s.icon,
    rating: s.rating,
    reviews: s.reviews,
    sold: s.sold,
    badge: s.badge,
    isNew: s.isNew,
    specs: s.specs,
    options: sampleOptions(s),
    variants,
    prices: { list: min("list"), midnight: min("midnight"), event: min("event"), flash: min("flash"), retailer: min("retailer") },
    qa: s.qa,
    flash: s.flash,
  };
}

export function sampleQuoteLine(s: SampleProduct, variantId: string, qty: number): QuoteLine {
  const props = Object.fromEntries(variantId.split(";").filter((x) => x.includes(":")).map((x) => x.split(":") as [string, string]));
  const costed = withVariantCost(s, props);
  const b = priceOf(costed);
  return { prices: pick(b), cost: b.cost, plannedProfit: b.plannedProfit, gadget: isGadget(costed), qty };
}
