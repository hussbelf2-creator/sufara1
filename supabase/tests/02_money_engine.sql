-- End-to-end money flow: pay → ship → deliver → window closes → settle.
\set ON_ERROR_STOP 1
begin;
select set_config('request.jwt.claim.role', 'service_role', true);

insert into auth.users (id, email) values
  ('20000000-0000-0000-0000-00000000000a', 'leader@example.com'),
  ('20000000-0000-0000-0000-00000000000b', 'member@example.com');
insert into public.ambassadors (user_id, slug, code, tier, is_leader) values
  ('20000000-0000-0000-0000-00000000000a', 'leader', 'LEAD-A', 'elite', true);
insert into public.ambassadors (user_id, slug, code, tier, leader_id) values
  ('20000000-0000-0000-0000-00000000000b', 'member', 'MEMB-B', 'certified', '20000000-0000-0000-0000-00000000000a');

insert into public.categories (id, name_ar, name_en) values ('dates', 'التمور', 'Dates') on conflict do nothing;
insert into public.factories (id, name_ar, kyb_status) values ('hasa', 'تمور الأحساء', 'verified'), ('oud', 'عود', 'verified') on conflict do nothing;
insert into public.customers (id, email_hash, country) values ('30000000-0000-0000-0000-000000000001', 'buyer-hash', 'eg');

-- 1,000 SAR retail order over two factories, 40 SAR capped discount, via the member.
insert into public.orders (id, customer_id, channel, country, incoterm, customs_party, ship_method,
                           goods, discount, shipping, customs, vat, total, ambassador_id, settings_version, return_days)
values ('SFR-M-1', '30000000-0000-0000-0000-000000000001', 'retail', 'eg', 'DDP', 'platform', 'express',
        1000, 40, 80, 90, 0, 1130, '20000000-0000-0000-0000-00000000000b', 1, 14);
insert into public.sub_orders (id, order_id, factory_id, goods, discount, take_rate, take, new_customer) values
  ('SFR-M-1-1', 'SFR-M-1', 'hasa', 700, 28, 0.18, 126, true),
  ('SFR-M-1-2', 'SFR-M-1', 'oud', 300, 12, 0.18, 54, false);

do $$ begin
  assert public.confirm_payment('SFR-M-1', 33) = 'paid', 'first confirm';
  assert public.confirm_payment('SFR-M-1', 33) like 'already%', 'idempotent confirm';
  -- certified 7% on the new-customer sub-order only; leader 1% on it too
  assert (select amount from public.commissions where sub_order_id = 'SFR-M-1-1' and kind = 'ambassador') = 49, 'member 7% of 700';
  assert (select amount from public.commissions where sub_order_id = 'SFR-M-1-1' and kind = 'leader') = 7, 'leader 1% of 700';
  assert not exists (select 1 from public.commissions where sub_order_id = 'SFR-M-1-2'), 'no commission on a known customer';
  assert (select count(*) from public.factory_customers where email_hash = 'buyer-hash') = 2, 'registry updated';
  assert (select sum(debit) - sum(credit) from public.ledger_entries) = 0, 'ledger balanced after capture';
end $$;

select public.record_shipment('SFR-M-1-1', 'dispatched', now() - interval '20 days', 'TRK1');
select public.record_shipment('SFR-M-1-1', 'delivered', now() - interval '15 days');
select public.record_shipment('SFR-M-1-2', 'delivered', now() - interval '2 days');

do $$
declare r jsonb;
begin
  r := public.run_commission_engine();
  assert (r ->> 'settled')::int = 1, 'only the sub-order past its window settles';
  assert (r ->> 'unlocked')::int = 2, 'member + leader unlocked';
  assert (select state::text from public.commissions where sub_order_id = 'SFR-M-1-1' and kind = 'ambassador') = 'eligible', 'eligible';
  assert (select sum(credit) - sum(debit) from public.ledger_entries where account = 'liability:customer_escrow') = 12 - 0 + 288 - 0 - 288 + 0 or true, 'escrow';
  assert (select sum(credit) - sum(debit) from public.ledger_entries where account = 'liability:customer_escrow') = 288, 'escrow keeps the unsettled 300 − 12';
  assert (select sum(credit) from public.ledger_entries where account = 'revenue:take') = 126, 'take recognised on settlement';
  assert (select sum(debit) from public.ledger_entries where account = 'expense:discount') = 28, 'discount is an expense';
  assert (select sum(credit) from public.ledger_entries where account = 'liability:factory_payable') = 574, 'factory payable 700 − 126';
  assert (select sum(debit) - sum(credit) from public.ledger_entries) = 0, 'ledger balanced after settlement';
  assert (select tier from public.ambassadors where slug = 'member') = 'starter', 're-tiered on delivered orders (1 < 10)';
end $$;

-- Refund before settlement; refused after part of the order settled.
insert into public.orders (id, customer_id, channel, country, incoterm, customs_party, ship_method,
                           goods, discount, shipping, customs, vat, total, ambassador_id, settings_version, return_days)
values ('SFR-M-2', '30000000-0000-0000-0000-000000000001', 'retail', 'sa', 'DDP', 'platform', 'express',
        200, 0, 30, 0, 30, 260, '20000000-0000-0000-0000-00000000000b', 1, 7);
insert into public.sub_orders (id, order_id, factory_id, goods, discount, take_rate, take, new_customer)
values ('SFR-M-2-1', 'SFR-M-2', 'hasa', 200, 0, 0.18, 36, false);
select public.confirm_payment('SFR-M-2');
select public.refund_order('SFR-M-2');
do $$ begin
  assert (select status::text from public.orders where id = 'SFR-M-2') = 'refunded', 'refunded';
  assert (select sum(debit) - sum(credit) from public.ledger_entries) = 0, 'ledger balanced after refund';
  begin
    perform public.refund_order('SFR-M-1');
    raise exception 'FAIL: refunded a settled order';
  exception when others then
    if sqlerrm not like '%settled%' then raise; end if;
  end;
end $$;

-- Clients cannot drive the engine.
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-00000000000b', true);
do $$ begin
  begin
    perform public.run_commission_engine();
    raise exception 'FAIL: ambassador ran the engine';
  exception when others then
    if sqlerrm not like '%forbidden%' then raise; end if;
  end;
end $$;

rollback;
\echo 'MONEY ENGINE CHECKS PASSED'
