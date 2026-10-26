\set ON_ERROR_STOP 1
begin;
create or replace function pg_temp.act(p_sub uuid, p_aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_sub::text, ''), true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.aal', p_aal, true);
end $$;
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-00000000000a', 'fin@safeer.sa'),
  ('a0000000-0000-0000-0000-00000000000b', 'riyadh.shop@example.com'),
  ('a0000000-0000-0000-0000-00000000000c', 'owner@hasa.sa'),
  ('a0000000-0000-0000-0000-00000000000d', 'duta@example.id');
insert into public.user_roles values ('a0000000-0000-0000-0000-00000000000a', 'admin', null, now());
update public.factories set owner_id = 'a0000000-0000-0000-0000-00000000000c' where id = 'hasa';

-- 1. domestic deal with VAT, paid by instalments → invoice issued
set local role authenticated;
select pg_temp.act('a0000000-0000-0000-0000-00000000000b');
select public.create_rfq('dates-khalas', null, 100, 'sa', 'Riyadh', 'DDP', null, null);
select pg_temp.act('a0000000-0000-0000-0000-00000000000c');
select public.submit_quote((select id from public.rfqs limit 1), 'hasa', 60, 10, '', current_date + 5);
select pg_temp.act('a0000000-0000-0000-0000-00000000000b');
select public.accept_quote((select id from public.quotes limit 1), '[{"days":0,"share":1}]');
do $$ begin
  assert (select vat from public.orders) = 900, '1. 15% VAT on 6000';
  assert (select total from public.deals) = 6900, 'deal includes VAT';
end $$;
select pg_temp.act('a0000000-0000-0000-0000-00000000000a', 'aal2');
select public.admin_record_instalment((select id from public.deals limit 1), 1, 'TRX');
do $$ begin
  assert (select invoice_no from public.orders) like 'INV-%', '3. invoice issued after deal payment';
  assert (select sum(debit) - sum(credit) from public.ledger_entries) = 0, 'balanced';
end $$;

-- 4. retail order paid by transfer, then 2. returned with VAT share
reset role;
insert into public.orders (id, customer_id, buyer_user_id, channel, country, incoterm, customs_party, ship_method, goods, vat, shipping, total, settings_version, return_days)
select 'SFR-T-9', id, 'a0000000-0000-0000-0000-00000000000b', 'retail', 'sa', 'DDP', 'platform', 'express', 400, 60, 22, 482, 1, 7 from public.customers limit 1;
insert into public.sub_orders (id, order_id, factory_id, goods, take_rate, take, new_customer) values ('SFR-T-9-1', 'SFR-T-9', 'hasa', 400, 0.18, 72, false);
set local role authenticated;
select pg_temp.act('a0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ begin
  begin perform public.admin_confirm_transfer('SFR-T-9', ''); raise exception 'FAIL: no reference';
  exception when others then if sqlerrm not like '%reference%' then raise; end if; end;
  assert public.admin_confirm_transfer('SFR-T-9', 'SARIE-77') = 'paid', '4. transfer confirmed';
  assert (select invoice_no from public.orders where id = 'SFR-T-9') like 'INV-%', 'invoice on transfer';
  assert public.refund_sub_order('SFR-T-9-1') = 460, '2. refund goods + VAT share';
  assert (select coalesce(sum(credit) - sum(debit), 0) from public.ledger_entries where account = 'liability:vat_payable' and order_id = 'SFR-T-9') = 0, 'VAT liability reversed';
  assert (select sum(debit) - sum(credit) from public.ledger_entries) = 0, 'balanced after refund';
end $$;

-- 5. wallet payouts
reset role;
update public.profiles set verification_status = 'verified' where id = 'a0000000-0000-0000-0000-00000000000d';
insert into public.ambassadors (user_id, slug, code) values ('a0000000-0000-0000-0000-00000000000d', 'duta', 'DUTA-1');
insert into public.commissions (sub_order_id, beneficiary_id, kind, rate, base, amount, state)
values ('SFR-T-9-1', 'a0000000-0000-0000-0000-00000000000d', 'ambassador', 0.5, 400, 300, 'eligible');
set local role authenticated;
select pg_temp.act('a0000000-0000-0000-0000-00000000000d');
do $$ begin
  begin perform public.request_payout('wallet'); raise exception 'FAIL: wallet payout without details';
  exception when others then if sqlerrm not like '%wallet details%' then raise; end if; end;
  perform public.submit_wallet('gopay', '+6281200000000');
  assert (public.request_payout('wallet') ->> 'amount')::numeric = 300, '5. wallet payout';
end $$;
select pg_temp.act('a0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ begin
  assert (select destination from public.admin_payouts) = 'gopay •••• 0000', 'admin sees masked destination';
end $$;
rollback;
\echo 'AUDIT FIX CHECKS PASSED'
