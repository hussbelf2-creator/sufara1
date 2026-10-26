-- Legal acceptances, PDPL requests/export/anonymisation, monitoring and health.
\set ON_ERROR_STOP 1
begin;
create or replace function pg_temp.act(p_sub uuid, p_aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_sub::text, ''), true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.aal', p_aal, true);
end $$;
insert into auth.users (id, email, raw_user_meta_data) values
  ('f0000000-0000-0000-0000-00000000000a', 'p-admin@safeer.sa', '{}'),
  ('f0000000-0000-0000-0000-00000000000b', 'p-buyer@example.pk', '{"full_name":"Ali","phone":"+92 300 1","legal_accepted":["terms@2026-10","privacy@2026-10","terms@1999-01"]}'),
  ('f0000000-0000-0000-0000-00000000000c', 'p-amb@example.id', '{"requested_panel":"ambassador","legal_accepted":["terms@2026-10","privacy@2026-10"]}');
insert into public.user_roles values ('f0000000-0000-0000-0000-00000000000a', 'admin', null, now());
insert into public.user_roles (user_id, role) values ('f0000000-0000-0000-0000-00000000000c', 'ambassador');

-- ── legal
do $$ begin
  assert (select count(*) from public.legal_acceptances where user_id = 'f0000000-0000-0000-0000-00000000000b') = 2,
    'sign-up versions recorded, unknown version ignored';
end $$;
set local role authenticated;
select pg_temp.act('f0000000-0000-0000-0000-00000000000b');
do $$ begin assert (select count(*) from public.my_pending_legal()) = 0, 'buyer has nothing pending'; end $$;
select pg_temp.act('f0000000-0000-0000-0000-00000000000c');
do $$ begin
  assert (select array_agg(key) from public.my_pending_legal()) = array['ambassador'], 'ambassador must accept the agreement';
  assert public.accept_legal(array['ambassador'], 'test-agent') = 0, 'accepted';
  begin perform public.accept_legal(array['nonsense']); raise exception 'FAIL: unknown doc accepted';
  exception when others then if sqlerrm not like '%unknown document%' then raise; end if; end;
end $$;
reset role;
-- a new terms version: everyone is asked again
insert into public.legal_documents values ('terms', '2026-11', current_date, '{buyer,ambassador,factory,admin}');
set local role authenticated;
select pg_temp.act('f0000000-0000-0000-0000-00000000000b');
do $$ begin
  assert (select array_agg(key || '@' || version) from public.my_pending_legal()) = array['terms@2026-11'], 'new version pending';
  perform public.accept_legal(array['terms']);
  assert (select count(*) from public.my_pending_legal()) = 0, 'cleared';
  assert (select count(*) from public.legal_acceptances) = 3, 'buyer sees only own acceptances';
end $$;

-- ── PDPL: export, requests, deletion
reset role;
insert into public.customers (id, email_hash, country) values ('c0000000-0000-0000-0000-0000000000f1', 'pf1', 'pk');
insert into public.orders (id, customer_id, buyer_user_id, buyer_email, buyer_phone, channel, country, incoterm, customs_party, ship_method, goods, shipping, total, settings_version, return_days, status, address)
values ('SFR-P-1', 'c0000000-0000-0000-0000-0000000000f1', 'f0000000-0000-0000-0000-00000000000b', 'p-buyer@example.pk', '+92 300 1', 'retail', 'pk', 'DDP', 'platform', 'express', 100, 40, 140, 1, 14, 'closed', 'Street 1, Lahore');
set local role authenticated;
select pg_temp.act('f0000000-0000-0000-0000-00000000000b');
do $$ declare x jsonb; rid bigint; begin
  x := public.export_my_data();
  assert x -> 'profile' ->> 'full_name' = 'Ali', 'profile exported';
  assert jsonb_array_length(x -> 'orders') = 1 and x -> 'orders' -> 0 ->> 'address' = 'Street 1, Lahore', 'orders exported';
  assert jsonb_array_length(x -> 'legal_acceptances') = 3, 'acceptances exported';
  rid := public.request_data_action('deletion', 'please delete');
  begin perform public.request_data_action('deletion'); raise exception 'FAIL: duplicate open request';
  exception when others then if sqlerrm not like '%already open%' then raise; end if; end;
  assert (select due_at::date from public.data_requests where id = rid) = (now() + interval '30 days')::date, '30-day deadline';
end $$;
select pg_temp.act('f0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ declare rid bigint := (select id from public.admin_data_requests where kind = 'deletion'); begin
  assert exists (select 1 from public.notifications where kind = 'privacy.request'), 'admins notified';
  begin perform public.admin_resolve_data_request(rid, 'rejected', ''); raise exception 'FAIL: reject without reason';
  exception when others then if sqlerrm not like '%reason%' then raise; end if; end;
  perform public.admin_resolve_data_request(rid, 'done', 'تم الحذف');
end $$;
reset role;
do $$ begin
  assert (select full_name from public.profiles where id = 'f0000000-0000-0000-0000-00000000000b') = 'محذوف', 'profile anonymised';
  assert (select buyer_phone is null and address is null from public.orders where id = 'SFR-P-1'), 'order contact removed';
  assert (select total from public.orders where id = 'SFR-P-1') = 140, 'order amounts kept for tax';
  assert not exists (select 1 from public.notifications where user_id = 'f0000000-0000-0000-0000-00000000000b'), 'notifications removed';
end $$;

-- ── monitoring
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select public.log_client_error('TypeError: x is undefined', 'at a.js:1', '/checkout', 'v7.5', 'UA');
select public.log_client_error('TypeError: x is undefined', 'at a.js:1', '/checkout', 'v7.5', 'UA');
do $$ begin
  begin perform public.record_job('nightly', 'ok'); raise exception 'FAIL: anon recorded a job';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  assert (select occurrences from public.client_errors where release = 'v7.5') = 2, 'same error counted on one row';
end $$;
select set_config('request.jwt.claim.role', 'service_role', true);
do $$ declare h jsonb; s jsonb; begin
  h := public.system_health();
  assert h ->> 'overall' = 'fail', 'no nightly/backup yet → fail';
  assert (select c ->> 'status' from jsonb_array_elements(h -> 'checks') c where c ->> 'key' = 'ledger_balance') = 'ok', 'ledger balanced';
  assert (select c ->> 'status' from jsonb_array_elements(h -> 'checks') c where c ->> 'key' = 'invoice_chain') = 'ok', 'invoice chain intact';
  s := public.health_sweep();
  assert exists (select 1 from public.notifications where kind = 'health.nightly'), 'admins alerted on failure';
  s := public.health_sweep();
  assert jsonb_array_length(s -> 'changed') = 0, 'no repeat alert while unchanged';
  perform public.record_job('nightly', 'ok', '{}');
  perform public.record_job('notify_dispatch', 'ok', '{}');
  perform public.record_job('backup', 'ok', '{"bytes":1}');
  s := public.health_sweep();
  assert exists (select 1 from jsonb_array_elements(s -> 'changed') c where c ->> 'key' = 'nightly' and c ->> 'to' = 'ok'), 'recovery reported';
  assert exists (select 1 from public.notifications where kind = 'health.nightly' and title like 'عاد للعمل%'), 'recovery alert';
end $$;
-- internal functions are not callable by clients
set local role anon;
do $$ begin
  begin perform public.audit('forged', 'orders', 'x', '{}'); raise exception 'FAIL: anon wrote an audit entry';
  exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
do $$ begin
  begin perform public.recompute_factory_kyb('hasa'); raise exception 'FAIL: client recomputed KYB';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- tampering with an invoice breaks the chain
reset role;
do $$ declare n int; begin
  insert into public.invoices (invoice_no, icv, order_id, payload, previous_hash, hash)
  values ('INV-T-1', 9001, 'SFR-P-1', '{"a":1}', 'bogus', 'bogus');
  n := public.invoice_chain_breaks();
  assert n >= 1, 'chain break detected';
end $$;
rollback;
\echo 'LEGAL + PRIVACY + MONITORING CHECKS PASSED'
