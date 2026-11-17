/**
 * Prints SQL that loads the sample catalogue into Supabase as demo products.
 * Run: npx tsx scripts/demo-catalogue-sql.ts > supabase/seed/demo-catalogue.sql
 * Remove later with: delete from public.products where is_demo;
 */
import { SAMPLE_PRODUCTS } from "../src/lib/catalog/sample";

const q = (v: unknown) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;

const out: string[] = ["-- Generated from src/lib/catalog/sample.ts. Demo data only.", "begin;", "delete from public.products where is_demo;"];

for (const p of SAMPLE_PRODUCTS) {
  const options = [
    ...(p.colors ? [{ name: "Colour", values: p.colors.map((c) => ({ label: c.name, hex: c.hex })) }] : []),
    ...(p.options ? [{ name: "Storage", values: p.options.map((o) => ({ label: o.label })) }] : []),
    ...(p.sizes ? [{ name: "Size", values: p.sizes.map((s) => ({ label: s })) }] : []),
  ];
  out.push(
    `insert into public.products (slug, title, description, category_id, status, sale_count, rating, reviews, badge, is_new, tint, icon, flash_claimed_pct, specs, options, weight_kg, cbm, source, is_demo, cny_min, cny_max)
values (${q(p.slug)}, ${q(p.name)}, ${q(p.description)}, (select id from public.categories where slug = ${q(p.category)}), 'active', ${p.sold}, ${p.rating}, ${p.reviews}, ${q(p.badge)}, ${p.isNew ? "true" : "false"}, ${q(p.tint)}, ${q(p.icon)}, ${p.flash?.claimedPct ?? "null"}, ${j(p.specs)}, ${j(options)}, ${p.weightKg}, ${p.cbm ?? "null"}, 'demo', true, ${p.options ? Math.min(...p.options.map((o) => o.cny)) : p.cny}, ${p.options ? Math.max(...p.options.map((o) => o.cny)) : p.cny});`,
  );
  // Every combination of option values becomes a SKU.
  let combos: Record<string, string>[] = [{}];
  for (const o of options) combos = combos.flatMap((c) => o.values.map((v) => ({ ...c, [o.name]: v.label })));
  combos.forEach((props, i) => {
    const cny = p.options?.find((o) => o.label === props.Storage)?.cny ?? p.cny;
    const text = Object.entries(props).map(([k, v]) => `${k}:${v}`).join(";");
    out.push(
      `insert into public.product_skus (product_id, source_sku_id, props, props_text, stock, cny_price, sort) values ((select id from public.products where slug = ${q(p.slug)}), ${q(text || "default")}, ${j(props)}, ${q(text || null)}, 500, ${cny}, ${i});`,
    );
  });
}
out.push("commit;");
console.log(out.join("\n"));
