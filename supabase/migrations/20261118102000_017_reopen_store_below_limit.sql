-- 017: if refunds take a free store back under ₦2,000,000, it can sell again.
create or replace function public.stores_count_sales() returns trigger
language plpgsql security definer set search_path = '' as $$
declare delta bigint := 0;
begin
  if new.store_id is null or new.status is not distinct from old.status then return null; end if;
  if new.status = 'paid' and old.status in ('awaiting_payment', 'part_paid') then delta := new.total_ngn; end if;
  if new.status in ('cancelled', 'refunded') and old.status not in ('awaiting_payment', 'part_paid') then delta := -old.total_ngn; end if;
  if delta = 0 then return null; end if;
  update public.stores set lifetime_sales_ngn = greatest(0, lifetime_sales_ngn + delta),
    status = case
      when plan = 'free' and status = 'active' and lifetime_sales_ngn + delta >= 2000000 then 'needs_upgrade'
      when plan = 'free' and status = 'needs_upgrade' and lifetime_sales_ngn + delta < 2000000 then 'active'
      else status end
  where id = new.store_id;
  return null;
end $$;
