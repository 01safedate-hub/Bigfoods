-- 011: cancelling or refunding twice is refused, so money is returned once only.
create or replace function public.cancel_or_refund(p_order uuid, p_note text) returns text
language plpgsql security definer set search_path = '' as $$
declare o public.orders; target text;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then raise exception 'Unknown order'; end if;
  target := case when o.status = 'shipped' then 'refunded' else 'cancelled' end;
  -- Refuse anything that isn't a real move (e.g. cancelling twice), so money is returned once only.
  if not public.order_can_move(o.status, target) then
    raise exception 'Order % is % and can''t be %', o.code, o.status, target using errcode = 'check_violation';
  end if;
  perform set_config('fastchina.note', coalesce(nullif(trim(p_note), ''), 'by staff'), true);
  update public.orders set status = target where id = o.id;
  if o.paid_ngn > 0 then
    if o.customer_id is not null then
      insert into public.wallet_ledger (customer_id, amount_ngn, reason, ref_id) values (o.customer_id, o.paid_ngn, 'order_refund', o.id);
    else
      insert into public.refunds_due (source, ref_id, amount_ngn) values ('order', o.id, o.paid_ngn);
    end if;
  end if;
  update public.payment_plans set status = 'cancelled' where order_id = o.id and status = 'active';
  return target;
end $$;
