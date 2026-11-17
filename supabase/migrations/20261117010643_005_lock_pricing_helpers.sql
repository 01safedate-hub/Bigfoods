revoke execute on function public.naira_per_cny() from public, anon, authenticated;
revoke execute on function public.payment_fee(numeric) from public, anon, authenticated;
comment on function public.has_role(public.app_role[]) is 'Used by RLS policies. Only reveals whether the caller has a role.';
comment on function public.is_staff() is 'Used by RLS policies. Only reveals whether the caller is staff.';
