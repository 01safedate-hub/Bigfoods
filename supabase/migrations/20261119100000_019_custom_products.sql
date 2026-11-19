-- Custom products: staff can add products that don't come from a 1688 import (own stock,
-- a supplier outside 1688, a product line we make). They are priced by the same engine as
-- imports (price_sku trigger), so every promotion keeps the same profit guardrails.

-- One call creates the product and all its variants, or nothing at all.
create or replace function public.create_custom_product(p jsonb)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  cat public.categories;
  pid uuid;
  base text;
  new_slug text;
  rate numeric;
  v jsonb;
  i int := 0;
  cny numeric;
begin
  select * into cat from public.categories where slug = p->>'category' and active;
  if cat.id is null then raise exception 'Unknown category'; end if;
  if length(coalesce(p->>'title', '')) not between 3 and 140 then raise exception 'Title must be 3–140 characters'; end if;
  if jsonb_typeof(p->'variants') <> 'array' or jsonb_array_length(p->'variants') not between 1 and 100 then
    raise exception 'Add between 1 and 100 variants';
  end if;
  if coalesce((p->>'weight_kg')::numeric, 0) <= 0 then raise exception 'Weight must be more than 0 kg'; end if;

  select round(naira_per_usd / cny_per_usd) into rate from public.pricing_settings where id = 1;

  -- A readable, unique address: title words plus a short random tail.
  base := left(trim(both '-' from regexp_replace(lower(p->>'title'), '[^a-z0-9]+', '-', 'g')), 60);
  loop
    new_slug := base || '-' || substr(md5(gen_random_uuid()::text), 1, 5);
    exit when not exists (select 1 from public.products where slug = new_slug);
  end loop;

  insert into public.products (
    slug, title, description, category_id, status, main_images, options, specs, badge, is_new, tint, icon,
    source, weight_kg, cbm, domestic_cny, synced_at
  ) values (
    new_slug,
    p->>'title',
    nullif(p->>'description', ''),
    cat.id,
    case when p->>'status' = 'active' then 'active'::public.product_status else 'draft'::public.product_status end,
    coalesce((select array_agg(x) from jsonb_array_elements_text(p->'images') x), '{}'),
    coalesce(p->'options', '[]'),
    coalesce(p->'specs', '[]'),
    nullif(p->>'badge', ''),
    true,
    coalesce(nullif(p->>'tint', ''), '#F2F2F2'),
    nullif(p->>'icon', ''),
    'custom',
    (p->>'weight_kg')::numeric,
    nullif(p->>'cbm', '')::numeric,
    coalesce(nullif(p->>'domestic_cny', '')::numeric, 0),
    now()
  ) returning id into pid;

  for v in select * from jsonb_array_elements(p->'variants') loop
    i := i + 1;
    -- Costs can be entered in yuan or naira; the engine works in yuan.
    cny := case when v->>'currency' = 'ngn' then round(((v->>'cost')::numeric / rate), 2) else (v->>'cost')::numeric end;
    if cny is null or cny <= 0 then raise exception 'Variant % needs a cost above 0', i; end if;
    insert into public.product_skus (product_id, props, props_text, image_url, stock, source_sku_id, cny_price, weight_kg, sort)
    values (
      pid,
      coalesce(v->'props', '{}'),
      nullif(v->>'label', ''),
      nullif(v->>'image', ''),
      greatest(0, coalesce((v->>'stock')::int, 0)),
      'custom-' || i,
      cny,
      nullif(v->>'weight_kg', '')::numeric,
      i
    );
  end loop;

  return new_slug;
end;
$$;

revoke execute on function public.create_custom_product(jsonb) from public, anon, authenticated;
grant execute on function public.create_custom_product(jsonb) to service_role;

comment on function public.create_custom_product(jsonb) is
  'Admin → Products → Add product. Creates a source=custom product and its variants atomically; prices come from price_sku().';
