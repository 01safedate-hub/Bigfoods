drop trigger products_reprice on public.products;

create or replace function public.products_reprice_skus()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.product_skus set cny_price = cny_price where product_id = new.id;
  return null;
end;
$$;

create trigger products_reprice
  after update of weight_kg, cbm, domestic_cny, category_id on public.products
  for each row execute function public.products_reprice_skus();

revoke execute on function public.products_reprice_skus() from public, anon, authenticated;
