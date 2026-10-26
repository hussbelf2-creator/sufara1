\set ON_ERROR_STOP 1
begin;
create or replace function pg_temp.act(p_sub uuid, p_aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_sub::text, ''), true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.aal', p_aal, true);
end $$;

insert into auth.users (id, email) values
  ('50000000-0000-0000-0000-00000000000a', 'admin@safeer.sa'),
  ('50000000-0000-0000-0000-00000000000b', 'amb@example.com'),
  ('50000000-0000-0000-0000-00000000000c', 'owner@hasa.sa'),
  ('50000000-0000-0000-0000-00000000000d', 'trader@example.com'),
  ('50000000-0000-0000-0000-00000000000e', 'owner@oud.sa');
insert into public.user_roles values ('50000000-0000-0000-0000-00000000000a', 'admin', null, now());
update public.profiles set verification_status = 'verified' where id = '50000000-0000-0000-0000-00000000000b';
insert into public.ambassadors (user_id, slug, code) values ('50000000-0000-0000-0000-00000000000b', 'amb', 'AMB-1');
insert into public.kyc_private (user_id, iban) values ('50000000-0000-0000-0000-00000000000b', 'SA0380000000608010167519');
update public.factories set owner_id = '50000000-0000-0000-0000-00000000000c' where id = 'hasa';
update public.factories set owner_id = '50000000-0000-0000-0000-00000000000e' where id = 'oud';

-- eligible commissions worth 260
insert into public.customers (id, email_hash) values ('60000000-0000-0000-0000-000000000001', 'x');
insert into public.orders (id, customer_id, channel, status, country, incoterm, customs_party, ship_method, goods, total, settings_version, return_days, paid_at)
values ('SFR-P-1', '60000000-0000-0000-0000-000000000001', 'retail', 'closed', 'eg', 'DDP', 'platform', 'express', 2000, 2000, 1, 14, now());
insert into public.sub_orders (id, order_id, factory_id, goods, take_rate, take, new_customer, settled)
values ('SFR-P-1-1', 'SFR-P-1', 'hasa', 2000, 0.18, 360, true, true);
insert into public.commissions (sub_order_id, beneficiary_id, kind, rate, base, amount, state)
values ('SFR-P-1-1', '50000000-0000-0000-0000-00000000000b', 'ambassador', 0.13, 2000, 260, 'eligible');

set local role authenticated;
select pg_temp.act('50000000-0000-0000-0000-00000000000b');
do $$ declare w jsonb; r jsonb; begin
  w := public.my_wallet();
  assert (w ->> 'eligible')::numeric = 260, 'wallet eligible';
  r := public.request_payout('bank');
  assert (r ->> 'amount')::numeric = 260, 'payout amount from server';
  begin
    perform public.request_payout('bank');
    raise exception 'FAIL: double payout';
  exception when others then if sqlerrm not like '%in progress%' then raise; end if; end;
end $$;

select pg_temp.act('50000000-0000-0000-0000-00000000000a', 'aal2');
do $$ declare pid bigint := (select id from public.payouts limit 1); begin
  perform public.admin_decide_payout(pid, 'approved');
  perform public.admin_decide_payout(pid, 'sent');
  assert (select state::text from public.commissions where sub_order_id = 'SFR-P-1-1') = 'paid', 'commission paid';
  assert (select sum(debit) from public.ledger_entries where account = 'liability:ambassador_payable') = 260, 'ledger moved';
  assert (select count(*) from public.admin_payouts) = 1, 'admin sees payout';
end $$;

-- wholesale
select pg_temp.act('50000000-0000-0000-0000-00000000000d');
insert into public.rfqs (id, buyer_user_id, category_id, qty, country, incoterm)
values ('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-00000000000d', 'dates', 1000, 'pk', 'CIF');

select pg_temp.act('50000000-0000-0000-0000-00000000000c');
select public.submit_quote('70000000-0000-0000-0000-000000000001', 'hasa', 49.5, 21, '30/70', current_date + 10);
do $$ begin
  begin
    perform public.submit_quote('70000000-0000-0000-0000-000000000001', 'oud', 40, 10, '', current_date + 5);
    raise exception 'FAIL: quoted for another factory';
  exception when others then if sqlerrm not like '%forbidden%' then raise; end if; end;
end $$;
select pg_temp.act('50000000-0000-0000-0000-00000000000e');
select public.submit_quote('70000000-0000-0000-0000-000000000001', 'oud', 52, 14, '', current_date + 10);

select pg_temp.act('50000000-0000-0000-0000-00000000000d');
do $$ declare d uuid; cheapest uuid; begin
  assert (select count(*) from public.quotes where rfq_id = '70000000-0000-0000-0000-000000000001') = 2, 'buyer compares 2 quotes';
  select id into cheapest from public.quotes where rfq_id = '70000000-0000-0000-0000-000000000001' order by unit_price limit 1;
  d := public.accept_quote(cheapest, '[{"days":0,"share":0.3},{"days":30,"share":0.7}]');
  assert (select total from public.deals where id = d) = 49500, 'deal total';
  assert (select sum(amount) from public.deal_installments where deal_id = d) = 49500, 'instalments add up';
  assert (select amount from public.deal_installments where deal_id = d and seq = 1) = 14850, '30% now';
  assert (select count(*) from public.quotes where status = 'rejected') = 1, 'other quote rejected';
end $$;
rollback;
\echo 'PAYOUT + WHOLESALE CHECKS PASSED'
