-- Supabase's default privileges grant ALL on new tables in `public` to both
-- anon and authenticated. The initial migration revoked anon but only added
-- GRANTs for authenticated, which was a no-op: authenticated still held
-- DELETE, TRUNCATE, REFERENCES and TRIGGER.
--
-- RLS was still denying those operations (an action with no matching policy is
-- refused), so no data was reachable. This restores the defense-in-depth layer
-- so a future policy mistake cannot silently expose DELETE or TRUNCATE.
revoke all on public.users         from authenticated;
revoke all on public.isq_responses from authenticated;
revoke all on public.risk_profiles from authenticated;

grant select, update         on public.users         to authenticated;
grant select, insert         on public.isq_responses to authenticated;
grant select, insert, update on public.risk_profiles to authenticated;
