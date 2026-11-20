-- Air freight China → Lagos is about $10/kg; at ₦1,600/$ that is ₦16,000/kg (set by the owner, 21 Nov 2026).
update public.pricing_settings set air_per_kg = 16000 where id = 1 and air_per_kg <> 16000;
alter table public.pricing_settings alter column air_per_kg set default 16000;
select public.reprice_all();
