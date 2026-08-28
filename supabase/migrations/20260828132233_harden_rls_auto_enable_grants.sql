-- public.rls_auto_enable() is a pre-existing event-trigger function that
-- auto-enables RLS on newly created public tables. It was reachable via
-- /rest/v1/rpc by anon and authenticated (Supabase advisors 0028/0029).
--
-- Event trigger functions are invoked by the system during DDL, not through
-- role EXECUTE grants, so revoking EXECUTE removes the API surface without
-- affecting the safety net it provides.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
