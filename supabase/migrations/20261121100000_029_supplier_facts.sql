-- 029: supplier facts from the Alibaba listing, shown to customers without naming the supplier.
--   dispatch_days     how long the supplier takes to send the goods to our China warehouse
--   custom_moq        the least the factory will customise (logo, packaging...), in pieces
--   custom_types      what the factory can customise, e.g. "Logo, Packaging"
--   supplier_*        reliability: verified, on-time delivery %, years on Alibaba

alter table public.products
  add column if not exists dispatch_days int,
  add column if not exists custom_moq int,
  add column if not exists custom_types text,
  add column if not exists supplier_verified boolean,
  add column if not exists supplier_ontime numeric(5,2),
  add column if not exists supplier_years int;

grant select (dispatch_days, custom_moq, custom_types, supplier_verified, supplier_ontime, supplier_years)
  on public.products to anon, authenticated;

-- Fill in from what earlier imports already saved.
update public.products p set
  dispatch_days = nullif((raw->'delivery_info'->>'delivery_days'), '')::numeric::int,
  custom_moq = (select min(nullif(o->>'min_order_quantity', '')::numeric)::int
                from jsonb_array_elements(case when jsonb_typeof(raw->'customization_options') = 'array' then raw->'customization_options' else '[]'::jsonb end) o),
  custom_types = (select string_agg(distinct o->>'custom_type', ', ')
                  from jsonb_array_elements(case when jsonb_typeof(raw->'customization_options') = 'array' then raw->'customization_options' else '[]'::jsonb end) o
                  where coalesce(o->>'custom_type', '') <> ''),
  supplier_verified = coalesce((raw->'shop_info'->>'is_verified_supplier')::boolean, false) or coalesce((raw->'shop_info'->>'is_company_auth')::boolean, false),
  supplier_ontime = nullif(regexp_replace(coalesce(raw->'shop_info'->>'ontime_delivery_rate', ''), '[^0-9.]', '', 'g'), '')::numeric,
  supplier_years = nullif(regexp_replace(coalesce(raw->'shop_info'->>'opening_years', ''), '[^0-9]', '', 'g'), '')::int
where p.source = 'alibaba' and p.raw is not null;

-- Customisation needs the factory minimum: all pieces of that product in the order count together.
create or replace function public.submit_customisation(p_item uuid, p_files text[], p_note text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare it record; rid bigint; pieces int;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select i.id, i.order_id, o.status, o.paid_ngn, p.customisable, p.custom_moq, p.id as product_id into it
  from public.order_items i join public.orders o on o.id = i.order_id
  join public.product_skus k on k.id = i.sku_id join public.products p on p.id = k.product_id
  where i.id = p_item and o.customer_id = auth.uid();
  if it.id is null then raise exception 'Item not found'; end if;
  if not it.customisable then raise exception 'This item can''t be customised'; end if;
  if it.custom_moq > 1 then
    select coalesce(sum(i.qty), 0) into pieces from public.order_items i join public.product_skus k on k.id = i.sku_id
    where i.order_id = it.order_id and k.product_id = it.product_id;
    if pieces < it.custom_moq then
      raise exception 'The factory customises from % pieces. This order has %, so it comes plain.', it.custom_moq, pieces;
    end if;
  end if;
  if it.paid_ngn <= 0 then raise exception 'Pay for your order first, then send your logo'; end if;
  if it.status not in ('part_paid', 'paid', 'purchasing', 'purchased', 'at_warehouse') then raise exception 'This order can''t be customised any more'; end if;
  if coalesce(cardinality(p_files), 0) not between 1 and 6 or exists (select 1 from unnest(p_files) f where f !~ '^https://') then raise exception 'Add 1 to 6 files'; end if;
  if exists (select 1 from public.order_customisations where order_item_id = p_item and status = 'paid') then raise exception 'This customisation is already paid'; end if;
  insert into public.order_customisations (order_id, order_item_id, customer_id, files, note)
  values (it.order_id, p_item, auth.uid(), p_files, nullif(trim(p_note), ''))
  on conflict (order_item_id) do update set files = excluded.files, note = excluded.note, status = 'reviewing',
    quote_ngn = null, quoted_at = null, updated_at = now()
  returning id into rid;
  return rid;
end $$;
revoke execute on function public.submit_customisation(uuid, text[], text) from public, anon;
grant execute on function public.submit_customisation(uuid, text[], text) to authenticated;
