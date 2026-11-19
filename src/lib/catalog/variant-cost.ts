import type { SampleProduct } from "./types";

/** Some sample variants change the factory cost (e.g. phone storage). */
export function withVariantCost(s: SampleProduct, props: Record<string, string>): SampleProduct {
  const o = s.options?.find((x) => x.label === props.Storage);
  return o ? { ...s, cny: o.cny } : s;
}
