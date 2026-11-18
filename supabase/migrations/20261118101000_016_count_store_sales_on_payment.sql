-- 016: count store sales when a payment marks an order paid. The status is changed by the orders_guard
-- trigger, not by the UPDATE statement itself, so "after update of status" never fired.
drop trigger orders_store_sales on public.orders;
create trigger orders_store_sales after update on public.orders for each row execute function public.stores_count_sales();
