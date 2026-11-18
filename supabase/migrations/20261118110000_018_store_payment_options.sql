-- 018: sellers can switch off Pay small small and take full payment only. Enforced when the order is placed.
alter table public.stores add column allow_small_small boolean not null default true;
grant select (allow_small_small) on public.stores to anon, authenticated;
grant update (allow_small_small) on public.stores to authenticated;

create or replace function public.place_store_order(
  p_store uuid, p_customer uuid, p_station text, p_phone text, p_mode text, p_total int, p_items jsonb, p_weeks int default null
) returns table (order_id uuid, code text, link_code text)
language plpgsql security definer set search_path = '' as $$
declare st public.stores; r record;
begin
  select * into st from public.stores where id = p_store;
  if st.id is null or st.status = 'suspended' then raise exception 'This store is closed'; end if;
  if st.status = 'needs_upgrade' then raise exception 'This store can’t take orders right now' using errcode = 'check_violation'; end if;
  if p_mode not in ('full', 'small') then raise exception 'Choose how to pay'; end if;
  if p_mode = 'small' and not st.allow_small_small then raise exception 'This store only takes full payment' using errcode = 'check_violation'; end if;
  select * into r from public.place_order(p_customer, p_station, p_phone, p_mode, p_total, null, 0, 0, p_items, p_weeks);
  update public.orders set store_id = p_store where id = r.order_id;
  update public.order_items i set store_markup_ngn = greatest(0, (x->>'markup')::int)
  from jsonb_array_elements(p_items) with ordinality as t(x, ord)
  where i.order_id = r.order_id and i.priority = t.ord;
  return query select r.order_id, r.code, r.link_code;
end $$;
