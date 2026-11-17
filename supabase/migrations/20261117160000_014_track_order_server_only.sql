-- 014: order tracking only through the website, where it is rate limited (stops guessing phone digits).
revoke execute on function public.track_order(text, text) from public, anon, authenticated;
grant execute on function public.track_order(text, text) to service_role;
