-- Behavioural checks for the migrations. Run on a disposable database after
-- 00_supabase_stub.sql and supabase/migrations/*.sql. Any failed expectation
-- raises and stops the script (psql -v ON_ERROR_STOP=1).

\set ON_ERROR_STOP 1
begin;

-- Helper to act as a user.
create or replace function pg_temp.act(p_sub uuid, p_aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_sub::text, ''), true);
  perform set_config('request.jwt.claim.role', case when p_sub is null then 'anon' else 'authenticated' end, true);
  perform set_config('request.jwt.claim.aal', p_aal, true);
end $$;

-- 1. A sign-up that asks to be an admin and "verified" gets neither.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'mallory@example.com',
   '{"full_name":"Mallory","requested_panel":"admin","verification_status":"verified","panel":"admin","iban":"SA0380000000608010167519"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ops@safeer.sa', '{"full_name":"Ops"}'),
  ('00000000-0000-0000-0000-00000000000c', 'amb@example.com', '{"full_name":"Amb","requested_panel":"ambassador"}');

do $$ begin
  assert (select requested_panel::text from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'buyer', 'admin request must downgrade to buyer';
  assert (select verification_status::text from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'unverified', 'status must not come from metadata';
  assert (select array_agg(role::text) from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000a') = array['buyer'], 'only buyer role';
  assert (select requested_panel::text from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 'ambassador', 'ambassador request recorded';
  assert not exists (select 1 from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000c' and role = 'ambassador'), 'ambassador role waits for approval';
end $$;

-- Bootstrap the first admin the way the runbook does (service role / SQL editor).
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000b', 'admin');

-- 2. The would-be attacker, signed in.
set local role authenticated;
select pg_temp.act('00000000-0000-0000-0000-00000000000a');

do $$ begin
  begin
    insert into public.user_roles (user_id, role) values (auth.uid(), 'admin');
    raise exception 'FAIL: user granted themselves admin';
  exception when insufficient_privilege or check_violation then null;
  end;
end $$;

update public.profiles set verification_status = 'verified', requested_panel = 'admin' where id = auth.uid();
do $$ begin
  assert (select verification_status::text from public.profiles where id = auth.uid()) = 'unverified', 'self-verify must be ignored';
  assert (select count(*) from public.profiles) = 1, 'user sees only own profile';
  assert (select count(*) from public.admin_accounts) = 0, 'non-admin sees no dossiers';
  assert not public.is_admin(), 'not admin';
end $$;

do $$ begin
  begin
    perform public.publish_platform_settings('{}'::jsonb, current_date, 'x');
    raise exception 'FAIL: non-admin published settings';
  exception when others then
    if sqlerrm not like '%forbidden%' then raise; end if;
  end;
  begin
    perform public.admin_set_verification(auth.uid(), 'verified');
    raise exception 'FAIL: non-admin verified an account';
  exception when others then
    if sqlerrm not like '%forbidden%' then raise; end if;
  end;
end $$;

select public.submit_kyc('1048821990', 'SA0380000000608010167519');
do $$ begin
  assert (select iban from public.kyc_private where user_id = auth.uid()) = 'SA0380000000608010167519', 'owner reads own kyc';
end $$;

-- 3. Admin without the second factor is not an admin for the database.
select pg_temp.act('00000000-0000-0000-0000-00000000000b', 'aal1');
do $$ begin assert not public.is_admin(), 'admin requires aal2'; end $$;

select pg_temp.act('00000000-0000-0000-0000-00000000000b', 'aal2');
do $$ begin
  assert public.is_admin(), 'admin with aal2';
  assert (select count(*) from public.admin_accounts) = 3, 'admin sees all dossiers';
  assert (select iban from public.admin_accounts where email = 'mallory@example.com') like 'SA03 •••• %', 'iban masked for admin';
  assert (select count(*) from public.kyc_private) = 0, 'admin cannot read raw kyc rows';
end $$;

select public.admin_set_verification('00000000-0000-0000-0000-00000000000c', 'verified');
do $$ begin
  assert exists (select 1 from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000c' and role = 'ambassador'), 'approval grants role';
  assert exists (select 1 from public.audit_log where action = 'account.verification'), 'decision audited';
end $$;

-- Settings guardrails.
do $$
declare good jsonb := '{
  "take":{"retail":{"value":0.18},"wholesale":{"value":0.06}},
  "ambassador":{"leaderBonus":0.01,"wholesale":{"value":0.02},"retailTiers":[{"rate":0.05},{"rate":0.07},{"rate":0.08}]},
  "promo":{"capRate":0.04,"channels":["retail"]},
  "costs":{"paymentFee":{"retail":0.029,"wholesale":0.008},"returnReserve":{"retail":0.01,"wholesale":0.005},"netFloor":0},
  "security":{"requireMfaForAdmin":true}}';
begin
  assert public.publish_platform_settings(good, current_date, 'v2 test') = 2, 'publishes v2';
  begin
    perform public.publish_platform_settings(jsonb_set(good, '{take,retail,value}', '0.15'), current_date, 'too thin');
    raise exception 'FAIL: loss-making settings published';
  exception when others then
    if sqlerrm not like '%below floor%' then raise; end if;
  end;
  begin
    perform public.publish_platform_settings(jsonb_set(good, '{take,retail,value}', '0.4'), current_date, 'greedy');
    raise exception 'FAIL: out-of-band take published';
  exception when others then
    if sqlerrm not like '%outside band%' then raise; end if;
  end;
end $$;

reset role;

-- 4. Ledger is balanced and append-only.
insert into public.categories (id, name_ar, name_en) values ('dates', 'التمور', 'Dates') on conflict do nothing;
insert into public.factories (id, name_ar, kyb_status) values ('hasa', 'تمور الأحساء', 'verified') on conflict do nothing;
insert into public.customers (id, email_hash, country) values ('10000000-0000-0000-0000-000000000001', 'h1', 'eg');
insert into public.orders (id, customer_id, channel, status, country, incoterm, customs_party, ship_method, goods, total, settings_version, return_days)
values ('SFR-T-1', '10000000-0000-0000-0000-000000000001', 'retail', 'paid', 'eg', 'DDP', 'platform', 'express', 1000, 1100, 2, 14),
       ('SFR-T-2', '10000000-0000-0000-0000-000000000001', 'retail', 'paid', 'eg', 'DDP', 'platform', 'express', 500, 560, 2, 14);

do $$ begin
  begin
    perform public.post_txn('bad', 'SFR-T-1', '[{"account":"cash","debit":100},{"account":"revenue","credit":90}]');
    raise exception 'FAIL: unbalanced txn accepted';
  exception when others then
    if sqlerrm not like '%unbalanced%' then raise; end if;
  end;
end $$;
select public.post_txn('capture', 'SFR-T-1', '[{"account":"cash:gateway","debit":1068},{"account":"expense:payment_fee","debit":32},{"account":"liability:customer_escrow","credit":1100}]');
do $$ begin
  begin
    update public.ledger_entries set debit = 1 where memo = 'capture';
    raise exception 'FAIL: ledger row edited';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
end $$;

-- 5. Invoices: gap-free and hash-chained.
select set_config('request.jwt.claim.role', 'service_role', true);
do $$
declare a jsonb; b jsonb; again jsonb;
begin
  a := public.issue_invoice('SFR-T-1');
  b := public.issue_invoice('SFR-T-2');
  again := public.issue_invoice('SFR-T-1');
  assert a ->> 'invoice_no' = 'INV-' || extract(year from now())::int || '-0000001', 'first number';
  assert b ->> 'invoice_no' = 'INV-' || extract(year from now())::int || '-0000002', 'second number, no gap';
  assert b ->> 'previous_hash' = a ->> 'hash', 'hash chain';
  assert again ->> 'invoice_no' = a ->> 'invoice_no', 'idempotent';
end $$;

-- 6. Team depth is one level.
-- 'c' already has an ambassador record from its approval above.
insert into public.ambassadors (user_id, slug, code, is_leader) values
  ('00000000-0000-0000-0000-00000000000b', 'leader', 'LEAD-1', true);
update public.ambassadors set leader_id = '00000000-0000-0000-0000-00000000000b' where user_id = '00000000-0000-0000-0000-00000000000c';
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000d', 'sub@example.com');
do $$ begin
  begin
    insert into public.ambassadors (user_id, slug, code, leader_id)
    values ('00000000-0000-0000-0000-00000000000d', 'sub', 'SUB-1', '00000000-0000-0000-0000-00000000000c');
    raise exception 'FAIL: two-level team accepted';
  exception when others then
    if sqlerrm not like '%one level%' then raise; end if;
  end;
end $$;

-- 7. Month close is hash-chained.
set local role authenticated;
select pg_temp.act('00000000-0000-0000-0000-00000000000b', 'aal2');
do $$
declare c1 public.ledger_closes; c2 public.ledger_closes;
begin
  c1 := public.close_ledger_period(current_date - 30, current_date);
  c2 := public.close_ledger_period(current_date - 30, current_date);
  assert c2.previous_hash = c1.hash, 'close chain';
  assert c1.entry_count = 3, 'close counted the capture lines';
end $$;

rollback;
\echo 'ALL DATABASE CHECKS PASSED'
