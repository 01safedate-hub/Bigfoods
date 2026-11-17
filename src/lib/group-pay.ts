/** Splits money raised across items in order (top first). Fully covered items can ship. */
export function allocate(prices: number[], funded: number): number[] {
  let left = funded;
  return prices.map((p) => {
    const got = Math.max(0, Math.min(p, left));
    left -= got;
    return got;
  });
}
