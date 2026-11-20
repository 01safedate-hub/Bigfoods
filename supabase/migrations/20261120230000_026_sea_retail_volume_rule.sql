-- Single items that ship by sea (furniture, machines) now use the same freight rule as wholesale:
-- volume is at least weight ÷ sea_kg_per_cbm, and the sea buffer covers packing. Before, heavy compact
-- items (e.g. a marble table) were charged on box volume only and could be undercharged.
-- Also records the new dollar rate (₦1,600) set by the owner on 20 Nov 2026.
update public.pricing_settings set naira_per_usd = 1600 where id = 1 and naira_per_usd <> 1600;
alter table public.pricing_settings alter column naira_per_usd set default 1600;

create or replace function public.price_sku(sku public.product_skus)
returns public.product_skus
language plpgsql stable security definer set search_path = '' as $$
declare
  s public.pricing_settings;
  p public.products;
  c public.categories;
  rate numeric;
  goods numeric; logistics numeric; profit numeric; cost numeric; w numeric; v numeric; local_fee numeric;
  sea_v numeric; sea_logistics numeric; w_profit numeric; w_cost numeric;
  r public.product_skus := sku;
begin
  select * into s from public.pricing_settings where id = 1;
  select * into p from public.products where id = sku.product_id;
  select * into c from public.categories where id = p.category_id;
  rate := round(s.naira_per_usd / s.cny_per_usd);
  w := coalesce(nullif(sku.weight_kg, 0), p.weight_kg, c.default_weight_kg, 0.5);
  v := coalesce(p.cbm, c.default_cbm, 0);
  goods := sku.cny_price * rate + coalesce(p.domestic_cny, 0) * rate;
  local_fee := public.local_delivery_fee(w, v);

  -- Sea: volume is at least weight ÷ kg-per-CBM, plus the packing buffer. Same rule for retail and wholesale.
  sea_v := greatest(v, w / s.sea_kg_per_cbm);
  sea_logistics := (sea_v * s.sea_per_cbm + w * s.sea_clearing_per_kg) * (1 + s.sea_buffer);

  logistics := case when coalesce(c.ship_mode, 'air') = 'sea' then sea_logistics
                 else w * (s.air_per_kg + s.clearing_per_kg) end;
  profit := case when coalesce(c.is_gadget, false) then sku.cny_price * rate * s.gadget_pct + s.gadget_flat
                 else sku.cny_price * rate * coalesce(c.margin, 0.8) end;
  cost := goods + logistics + local_fee + s.weighing_fee_per_item;

  r.cost_ngn := cost;
  r.planned_profit_ngn := profit;
  r.price_list      := ceil((cost + profit + public.payment_fee(cost + profit)) / 100) * 100;
  r.price_midnight  := ceil((cost + profit * (1 - s.promo_midnight) + public.payment_fee(cost + profit * (1 - s.promo_midnight))) / 100) * 100;
  r.price_event     := ceil((cost + profit * (1 - s.promo_event) + public.payment_fee(cost + profit * (1 - s.promo_event))) / 100) * 100;
  r.price_flash     := ceil((cost + profit * (1 - s.promo_flash) + public.payment_fee(cost + profit * (1 - s.promo_flash))) / 100) * 100;
  r.price_retailer  := ceil((cost + profit * (1 - s.promo_retailer) + public.payment_fee(cost + profit * (1 - s.promo_retailer))) / 100) * 100;

  -- Wholesale: by sea to Lagos and cleared. Local delivery is billed separately by state.
  w_profit := sku.cny_price * rate * coalesce(c.wholesale_margin, 0.25);
  w_cost := goods + sea_logistics + s.weighing_fee_per_item;
  r.wholesale_cost_ngn := ceil(w_cost);
  r.wholesale_profit_ngn := floor(w_profit);
  r.price_wholesale := ceil((w_cost + w_profit + public.payment_fee(w_cost + w_profit)) / 100) * 100;
  return r;
end;
$$;

select public.reprice_all();
