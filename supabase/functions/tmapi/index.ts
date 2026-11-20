// TMAPI (1688 data) gateway. The API key never leaves the server.
//
// POST /functions/v1/tmapi
//   { "action": "search", "keyword": "wig", "page": 1 }
//   { "action": "import", "item_id": 652702302959, "category": "hair" }   // or "url": "https://detail.1688.com/offer/….html"
//   { "action": "check_images", "item_id": 652702302959, "mirror": true }
//   { "action": "alibaba_search", "keyword": "lace front wig" }                       // Alibaba.com
//   { "action": "alibaba_import", "keyword": "lace front wig", "category": "hair", "count": 3 }
//   { "action": "alibaba_import", "url": "https://www.alibaba.com/product-detail/…html", "category": "hair" }
//
// Auth: a staff JWT (super_admin, purchasing, marketing) or the x-task-token header
// (scheduled jobs, value in public.internal_tokens). verify_jwt is off because we check here.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const TMAPI_KEY = Deno.env.get("TMAPI_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HOSTS = ["https://api.tmapi.top", "http://api.tmapi.top"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { "Content-Type": "application/json" } });

async function authorised(req: Request, db: SupabaseClient): Promise<boolean> {
  const task = req.headers.get("x-task-token");
  if (task) {
    const { data } = await db.from("internal_tokens").select("token").eq("name", "tasks").single();
    return !!data && data.token === task;
  }
  const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return false;
  const { data: u } = await db.auth.getUser(jwt);
  if (!u?.user) return false;
  const { data: p } = await db.from("profiles").select("role").eq("id", u.user.id).single();
  return ["super_admin", "purchasing", "marketing"].includes(p?.role ?? "");
}

let workingHost: string | null = null;

// The key allows one request at a time ("x-count-limit: sc=1"), so busy answers are retried after a pause.
async function tmapi(db: SupabaseClient, path: string, params: Record<string, string | number>, body?: unknown) {
  for (let attempt = 0; ; attempt++) {
    const r = await tmapiOnce(db, path, params, body);
    if (attempt >= 3 || !(r.code === 4291 || r.code === 417)) return r;
    await new Promise((ok) => setTimeout(ok, 1500 * (attempt + 1)));
  }
}

async function tmapiOnce(db: SupabaseClient, path: string, params: Record<string, string | number>, body?: unknown) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const hosts = workingHost ? [workingHost] : HOSTS;
  let lastErr = "";
  for (const host of hosts) {
    const started = Date.now();
    try {
      const res = await fetch(`${host}${path}${qs ? `?${qs}` : ""}`, {
        method: body ? "POST" : "GET",
        headers: { apikey: TMAPI_KEY, ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(25_000),
      });
      const text = await res.text();
      let data: { code?: number; msg?: string; message?: string; data?: unknown } = {};
      try { data = JSON.parse(text); } catch { data = { msg: text.slice(0, 300) }; }
      if (!data.msg) data.msg = data.message ?? (data.code === 200 ? "success" : text.slice(0, 300));
      await db.from("api_calls").insert({
        endpoint: path, params: { ...params, host }, http_status: res.status, api_code: data.code ?? null,
        message: data.msg ?? null, duration_ms: Date.now() - started,
      });
      workingHost = host;
      // Any quota / rate-limit headers TMAPI sends back, so staff can see what's left.
      const limits = Object.fromEntries([...res.headers].filter(([k]) => /quota|limit|remain|balance|credit|usage/i.test(k)));
      return { ok: res.ok && data.code === 200, status: res.status, host, limits, ...data };
    } catch (e) {
      lastErr = `${host}: ${(e as Error).message}`;
    }
  }
  return { ok: false, status: 0, host: null, limits: {}, code: null, msg: lastErr, data: null };
}

// ---- Mapping helpers ----------------------------------------------------------------
type Detail = Record<string, any>;

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 60).replace(/-$/, "");
const https = (u?: string | null) => (u ? u.replace(/^\/\//, "https://").replace(/^http:\/\//, "https://") : null);

function parseProps(propsNames?: string) {
  const out: Record<string, string> = {};
  for (const part of (propsNames ?? "").split(";")) {
    const [k, ...v] = part.split(":");
    if (k && v.length) out[k.trim()] = v.join(":").trim();
  }
  return out;
}

function skuImage(d: Detail, propsIds?: string) {
  if (!propsIds) return null;
  for (const pair of propsIds.split(";")) {
    const [pid, vid] = pair.split(":");
    const prop = (d.sku_props ?? []).find((p: any) => String(p.pid) === pid);
    const val = prop?.values?.find((v: any) => String(v.vid) === vid);
    if (val?.imageUrl) return https(val.imageUrl);
  }
  return null;
}

async function importItem(db: SupabaseClient, d: Detail, category?: string) {
  let categoryId: number | null = null;
  if (category) {
    const { data } = await db.from("categories").select("id").eq("slug", category).single();
    categoryId = data?.id ?? null;
  }
  const itemId = Number(d.item_id);
  const title = String(d.title ?? `1688 item ${itemId}`);
  const product = {
    source: "1688",
    source_item_id: itemId,
    source_url: d.product_url ?? `https://detail.1688.com/offer/${itemId}.html`,
    slug: `${slugify(title) || "item"}-${itemId}`,
    title,
    category_id: categoryId,
    main_images: (d.main_imgs ?? []).map(https).filter(Boolean),
    video_url: https(d.video_url),
    props: d.product_props ?? [],
    sale_count: Math.round(num(d.sale_count) ?? 0),
    supplier: d.shop_info ?? {},
    location: d.delivery_info?.location ?? null,
    weight_kg: (num(d.delivery_info?.unit_weight) ?? 0) > 0 ? num(d.delivery_info?.unit_weight) : null,
    cny_min: num(d.price_info?.price_min ?? d.price_info?.price),
    cny_max: num(d.price_info?.price_max ?? d.price_info?.price),
    tiered_prices: d.tiered_price_info?.prices ?? [],
    mixed_batch: d.mixed_batch ?? {},
    raw: d,
    synced_at: new Date().toISOString(),
  };
  const { data: saved, error } = await db.from("products").upsert(product, { onConflict: "source,source_item_id" }).select("id, slug").single();
  if (error) throw new Error(`products: ${error.message}`);

  const skus = (d.skus?.length ? d.skus : [{ skuid: "default", sale_price: d.price_info?.price, stock: d.stock }]).map((s: any) => ({
    product_id: saved.id,
    source_sku_id: String(s.skuid),
    source_spec_id: s.specid ? String(s.specid) : null,
    props: parseProps(s.props_names),
    props_text: s.props_names ?? null,
    image_url: skuImage(d, s.props_ids),
    stock: Math.round(num(s.stock) ?? 0),
    cny_price: num(s.sale_price) ?? num(d.price_info?.price) ?? 0,
    weight_kg: (num(s.package_info?.weight) ?? 0) > 0 ? num(s.package_info?.weight) : null,
  }));
  const { error: skuErr } = await db.from("product_skus").upsert(skus, { onConflict: "product_id,source_sku_id" });
  if (skuErr) throw new Error(`product_skus: ${skuErr.message}`);

  const { data: priced } = await db.from("product_skus").select("props_text, cny_price, weight_kg, stock, price_list, price_midnight, price_retailer").eq("product_id", saved.id).limit(5);
  return { product_id: saved.id, slug: saved.slug, sku_count: skus.length, sample_prices: priced };
}

// ---- Alibaba.com items -----------------------------------------------------------------
// Prices come in USD. The pricing engine works in yuan, so we convert at the admin rate.
// Alibaba skus carry the bulk price; a single unit costs the first price tier, so retail uses that.
const ICONS: Record<string, string> = { gadgets: "phone", fashion: "shirt", hair: "wig", beauty: "lipstick", jewellery: "watch", audio: "audio", shoes: "shoe", bags: "bag", home: "home", kids: "kids", furniture: "chair", machines: "machine" };
const TINTS: Record<string, string> = { gadgets: "#E6E9EF", fashion: "#F3E6EA", hair: "#F1E4D6", beauty: "#F7E3E8", jewellery: "#EFE9DC", audio: "#E4E9F2", shoes: "#ECE7E1", bags: "#EEE6DE", home: "#E3EEE8", kids: "#E9F0F7", furniture: "#ECE6DD", machines: "#E5E7EA" };

// Copies an image into our storage (year-long cache). Returns our URL, or the original and why not.
async function mirror(db: SupabaseClient, url: string, path: string): Promise<{ url: string; error?: string }> {
  let r = await probeImage(url);
  for (let i = 0; i < 2 && !r.ok; i++) { await new Promise((ok) => setTimeout(ok, 900)); r = await probeImage(url); }
  if (!r.ok || !r.buf) return { url, error: `fetch ${r.status} ${r.type ?? ""} ${(r as any).error ?? ""}`.trim() };
  const ext = (r.type ?? "image/jpeg").split("/")[1].replace("jpeg", "jpg").replace(/[^a-z]/g, "");
  const { error } = await db.storage.from("product-images").upload(`${path}.${ext}`, r.buf, { contentType: r.type ?? "image/jpeg", upsert: true, cacheControl: "31536000" });
  if (error) return { url, error: `upload: ${error.message}` };
  return { url: db.storage.from("product-images").getPublicUrl(`${path}.${ext}`).data.publicUrl };
}

// Supplier titles are keyword lists ("2025 Hot Selling Wholesale OEM ..."). Keep the product words.
function cleanTitle(t: string) {
  const out = t
    .replace(/\b(20\d\d|new arrivals?|hot[- ]?sell(ing|er)?s?|hot[- ]?sale|best[- ]?sell(ing|er)s?|wholesale|factory( direct| price)?|custom(ized)? logo|oem|odm|cheap|free shipping|dropshipping|high quality|top quality|in stock|ready to ship|manufacturers?|suppliers?)\b/gi, " ")
    .replace(/\b[A-Z]{2,}[-_]?\d{2,}[A-Z0-9-]*\b/g, " ") // model codes like SNB-001
    .replace(/\s+([,/&])/g, "$1").replace(/\s{2,}/g, " ").replace(/^[\s,/&-]+|[\s,/&-]+$/g, "").trim();
  const lead = out.replace(/^new\s+/i, "");
  const short = lead.length > 90 ? lead.slice(0, 90).replace(/\s+\S*$/, "") : lead;
  return short ? short[0].toUpperCase() + short.slice(1) : t.slice(0, 90);
}

async function importAlibaba(db: SupabaseClient, d: Detail, category: string, maxMoq = 1, maxUsd?: number) {
  const moq = Math.max(1, num(d.min_order_quantity) ?? 1);
  if (moq > maxMoq) return { skipped: true, reason: `Minimum order is ${moq} ${d.unit ?? "pieces"}` };
  // Listings we can't price safely: made-to-order logo items, or no shipping weight given.
  if (/\bcustom(ized)?\s+(logo|design|made)\b/i.test(String(d.title ?? ""))) return { skipped: true, reason: "Made-to-order item" };
  if (!((num(d.delivery_info?.unit_weight) ?? 0) > 0)) return { skipped: true, reason: "Supplier gives no shipping weight" };
  const { data: cat } = await db.from("categories").select("id, slug").eq("slug", category).single();
  if (!cat) throw new Error(`Unknown category ${category}`);
  const { data: rate } = await db.from("pricing_settings").select("cny_per_usd").eq("id", 1).single();
  const cnyPerUsd = Number(rate?.cny_per_usd ?? 7.2);

  const tiers = ((d.tiered_price_info ?? []) as any[]).map((t) => num(t.price)).filter((n): n is number => !!n);
  const single = tiers.length ? tiers[0] : num(d.price_info?.price_max);
  const lowest = tiers.length ? Math.min(...tiers) : num(d.price_info?.price_min);
  const bump = single && lowest ? single / lowest : 1; // sku price -> single-unit price
  // Search shows the bulk price; the price for one piece can be much higher.
  if (maxUsd && single && single > maxUsd * 1.5) return { skipped: true, reason: `One piece costs $${single}` };

  const itemId = Number(d.item_id);
  const title = cleanTitle(String(d.title ?? `Item ${itemId}`));
  const imgs: string[] = [];
  const imageErrors: string[] = [];
  for (const [i, u] of ((d.main_imgs ?? []) as string[]).map(https).filter(Boolean).slice(0, 8).entries()) {
    const m = await mirror(db, u!, `alibaba/${itemId}/${i}`);
    imgs.push(m.url);
    if (m.error) imageErrors.push(m.error);
  }
  const w = num(d.delivery_info?.unit_weight);
  const dims = String(d.delivery_info?.unit_size ?? "").split(/x/i).map(num).filter((n): n is number => !!n);
  const cbm = dims.length === 3 ? Math.round((dims[0] * dims[1] * dims[2]) / 1e6 * 10000) / 10000 : null;
  const props = ((d.product_props ?? []) as any[]).filter((p) => p.key && p.value && !/brand|model/i.test(p.key));

  const options = ((d.sku_props ?? []) as any[]).filter((p) => (p.values ?? []).length > 1 || (p.values ?? []).some((v: any) => v.imageUrl))
    .map((p) => ({ name: String(p.prop_name), values: (p.values ?? []).map((v: any) => ({ label: String(v.name) })) }));
  const optionNames = new Set(options.map((o) => o.name));

  const product = {
    source: "alibaba", source_item_id: itemId, source_url: d.product_url ?? null,
    slug: `${slugify(title) || "item"}-${itemId}`, title, category_id: cat.id, status: "active", is_demo: false,
    main_images: imgs, video_url: https(d.video_url), props: d.product_props ?? [],
    sale_count: Math.round(num(d.sales_count) ?? 0), rating: num(d.review_info?.rating_star), reviews: 0,
    supplier: d.shop_info ?? {}, location: d.delivery_info?.area_from || null,
    weight_kg: w && w > 0 ? w : null, cbm,
    cny_min: lowest ? Math.round(lowest * cnyPerUsd * 100) / 100 : null, cny_max: single ? Math.round(single * cnyPerUsd * 100) / 100 : null,
    tiered_prices: d.tiered_price_info ?? [], raw: d, synced_at: new Date().toISOString(),
    tint: TINTS[cat.slug] ?? "#ECECEC", icon: ICONS[cat.slug] ?? "gift",
    options, specs: [...props.slice(0, 8).map((p: any) => [String(p.key), String(p.value)]), ...(w ? [["Shipping weight", `${w} kg`]] : [])],
  };
  const { data: saved, error } = await db.from("products").upsert(product, { onConflict: "source,source_item_id" }).select("id, slug").single();
  if (error) throw new Error(`products: ${error.message}`);

  const raw = (d.skus?.length ? d.skus : [{ skuid: "default", sale_price: lowest ?? single, stock: -1 }]) as any[];
  const skus = raw.slice(0, 60).map((s, i) => {
    const all = parseProps(s.props_names);
    const shown = Object.fromEntries(Object.entries(all).filter(([k]) => optionNames.has(k)));
    const usd = (num(s.sale_price) ?? lowest ?? 0) * bump;
    return {
      product_id: saved.id, source_sku_id: String(s.skuid), props: shown, props_text: s.props_names ?? null,
      image_url: skuImage(d, s.props_ids), stock: (num(s.stock) ?? -1) < 0 ? 999 : Math.round(num(s.stock)!), sort: i,
      cny_price: Math.round(usd * cnyPerUsd * 100) / 100, weight_kg: w && w > 0 ? w : null, active: true,
    };
  });
  // Variants that differ only in hidden props collapse to one: keep the dearest so we never sell below cost.
  const byKey = new Map<string, (typeof skus)[number]>();
  for (const k of skus) {
    const key = JSON.stringify(k.props);
    const had = byKey.get(key);
    if (!had || k.cny_price > had.cny_price) byKey.set(key, k);
  }
  const keep = [...byKey.values()];
  await db.from("product_skus").delete().eq("product_id", saved.id).not("source_sku_id", "in", `(${keep.map((k) => `"${k.source_sku_id}"`).join(",")})`);
  const { error: skuErr } = await db.from("product_skus").upsert(keep, { onConflict: "product_id,source_sku_id" });
  if (skuErr) throw new Error(`product_skus: ${skuErr.message}`);
  const { data: priced } = await db.from("product_skus").select("props, cny_price, price_list, price_wholesale").eq("product_id", saved.id).order("price_list").limit(3);
  return { slug: saved.slug, title, moq, usd_single: single, variants: keep.length, images: imgs.length, mirrored: imgs.filter((u) => u.includes("supabase")).length, ...(imageErrors.length ? { image_errors: imageErrors.slice(0, 2) } : {}), prices: priced };
}

// ---- Image checks ---------------------------------------------------------------
async function probeImage(url: string, referer?: string) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", Accept: "image/webp,image/jpeg,image/png;q=0.9,*/*;q=0.5", ...(referer ? { Referer: referer } : {}) },
      redirect: "follow", signal: AbortSignal.timeout(15_000),
    });
    const buf = new Uint8Array(await res.arrayBuffer());
    return { status: res.status, type: res.headers.get("content-type"), bytes: buf.byteLength, ms: Date.now() - started, ok: res.ok && (res.headers.get("content-type") ?? "").startsWith("image/"), buf };
  } catch (e) {
    return { status: 0, type: null, bytes: 0, ms: Date.now() - started, ok: false, error: (e as Error).message, buf: null };
  }
}

async function checkImages(db: SupabaseClient, d: Detail, mirror: boolean) {
  const urls: string[] = [
    ...(d.main_imgs ?? []).map(https),
    ...(d.sku_props ?? []).flatMap((p: any) => (p.values ?? []).map((v: any) => https(v.imageUrl))),
  ].filter(Boolean).slice(0, 6) as string[];
  const results = [];
  for (const [i, url] of urls.entries()) {
    const plain = await probeImage(url);
    const ours = await probeImage(url, "https://fastchina.shop/");
    let mirrored: string | null = null;
    if (mirror && i === 0 && plain.ok && plain.buf) {
      const ext = (plain.type ?? "image/jpeg").split("/")[1].replace("jpeg", "jpg");
      const path = `1688/${d.item_id}/main-0.${ext}`;
      const { error } = await db.storage.from("product-images").upload(path, plain.buf, { contentType: plain.type ?? "image/jpeg", upsert: true, cacheControl: "31536000" });
      mirrored = error ? `upload failed: ${error.message}` : db.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }
    results.push({
      url,
      no_referer: { status: plain.status, type: plain.type, kb: Math.round(plain.bytes / 1024), ms: plain.ms, ok: plain.ok },
      with_fastchina_referer: { status: ours.status, type: ours.type, kb: Math.round(ours.bytes / 1024), ok: ours.ok },
      ...(mirrored ? { mirrored_to: mirrored } : {}),
    });
  }
  return { images_found: { main: (d.main_imgs ?? []).length, sku_option_images: (d.sku_props ?? []).flatMap((p: any) => p.values ?? []).filter((v: any) => v.imageUrl).length, video: !!d.video_url }, checked: results };
}

// Short view of a TMAPI payload: top-level keys plus the first two items.
function summarise(d: any) {
  if (!d || typeof d !== "object") return d;
  if (Array.isArray(d.items)) return { ...Object.fromEntries(Object.entries(d).filter(([k]) => k !== "items" && k !== "filters")), items: d.items.slice(0, 3) };
  return { keys: Object.keys(d), title: d.title, price_info: d.price_info, skus: (d.skus ?? []).length, delivery_info: d.delivery_info };
}

// ---- Handler ----------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  if (!(await authorised(req, db))) return json({ error: "Not allowed" }, 401);
  if (!TMAPI_KEY) return json({ error: "TMAPI_KEY secret is not set" }, 500);

  let input: Record<string, any> = {};
  try { input = await req.json(); } catch { /* empty body */ }
  const language = input.language ?? "en";

  try {
    if (input.action === "search") {
      const r = await tmapi(db, "/1688/global/search/items", { keyword: input.keyword ?? "wig", page: input.page ?? 1, page_size: 10, language });
      const items = ((r.data as any)?.items ?? []).map((it: any) => ({ item_id: it.item_id, title: it.title, img: it.img, price: it.price, currency: it.currency, sold_90d: it.sale_info?.sale_quantity_90days }));
      return json({ ok: r.ok, host: r.host, code: r.code, msg: r.msg, limits: r.limits, count: items.length, items });
    }

    if (input.action === "raw") {
      // Staff check of which TMAPI endpoints this key can use. Allow-listed paths only.
      const RAW: Record<string, "GET" | "POST"> = {
        "/1688/search/items": "GET", "/1688/global/search/items": "GET", "/1688/item_detail": "GET",
        "/1688/item_detail_by_url": "POST", "/alibaba/search/items": "GET", "/alibaba/item_detail_by_url": "POST",
      };
      const method = RAW[input.path];
      if (!method) return json({ error: "Path not allowed" }, 400);
      const r = method === "POST" ? await tmapi(db, input.path, {}, input.body ?? {}) : await tmapi(db, input.path, input.params ?? {});
      return json({ ok: r.ok, status: r.status, code: r.code, msg: r.msg, limits: r.limits, data: input.full ? r.data : summarise(r.data) });
    }

    if (input.action === "alibaba_search") {
      const r = await tmapi(db, "/alibaba/search/items", { keywords: input.keyword ?? "wig", page: input.page ?? 1, ...(input.sort ? { sort: input.sort } : {}) });
      const items = ((r.data as any)?.items ?? []).map((it: any) => ({ item_id: it.item_id, url: it.product_url, title: it.title, usd: it.price_info?.price_text, moq: it.min_order_quantity, rating: it.review_info?.rating_score, verified: it.shop_info?.is_verified_supplier }));
      return json({ ok: r.ok, code: r.code, msg: r.msg, limits: r.limits, count: items.length, items });
    }

    if (input.action === "alibaba_import") {
      // { url, category } for one item, or { keyword, category, count } to import the top matches.
      if (!input.category) return json({ error: "category is required" }, 400);
      let urls: string[] = input.url ? [input.url] : [];
      if (!urls.length) {
        const r = await tmapi(db, "/alibaba/search/items", { keywords: input.keyword ?? "", page: 1, sort: input.sort ?? "relevance" });
        if (!r.ok) return json({ ok: false, code: r.code, msg: r.msg }, 502);
        urls = ((r.data as any)?.items ?? [])
          .filter((it: any) => (num(it.min_order_quantity) ?? 1) <= (input.max_moq ?? 1) && (!input.max_usd || (num(it.price_info?.price_min) ?? 0) <= input.max_usd))
          .slice(0, Math.min(input.count ?? 3, 10)).map((it: any) => it.product_url);
      }
      const results = [];
      for (const url of urls) {
        if (!/^https:\/\/(www\.)?alibaba\.com\/product-detail\//.test(url)) { results.push({ url, error: "Not an Alibaba.com product link" }); continue; }
        const det = await tmapi(db, "/alibaba/item_detail_by_url", {}, { url, currency: "USD" });
        if (!det.ok) { results.push({ url, error: det.msg }); continue; }
        try { results.push(await importAlibaba(db, det.data as Detail, input.category, input.max_moq ?? 1, input.max_usd)); }
        catch (e) { results.push({ url, error: (e as Error).message }); }
      }
      return json({ ok: true, imported: results.filter((r: any) => r.slug).length, results });
    }

    if (input.action === "probe_images") {
      // Staff check that 1688 image URLs load and can be copied into our storage. Alibaba image hosts only.
      const urls: string[] = (input.urls ?? []).slice(0, 6);
      if (!urls.every((u) => /^https:\/\/[a-z0-9-]+\.alicdn\.com\//i.test(u))) return json({ error: "Only https://*.alicdn.com image URLs" }, 400);
      return json({ ok: true, ...(await checkImages(db, { item_id: "probe", main_imgs: urls }, !!input.mirror)) });
    }

    const detail = input.url
      ? await tmapi(db, "/1688/item_detail_by_url", {}, { url: input.url, language })
      : await tmapi(db, "/1688/item_detail", { item_id: input.item_id, language });
    if (!detail.ok) return json({ ok: false, host: detail.host, status: detail.status, code: detail.code, msg: detail.msg }, 502);
    const d = detail.data as Detail;

    if (input.action === "check_images") {
      return json({ ok: true, host: detail.host, item_id: d.item_id, title: d.title, ...(await checkImages(db, d, !!input.mirror)) });
    }
    if (input.action === "import") {
      return json({ ok: true, host: detail.host, limits: detail.limits, ...(await importItem(db, d, input.category)) });
    }
    return json({ error: "Unknown action. Use search, import, check_images, probe_images, raw, alibaba_search or alibaba_import." }, 400);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
