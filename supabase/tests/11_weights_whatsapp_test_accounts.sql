-- Product weights, buyer shipping notices with WhatsApp contact, test-account provisioning.
\set ON_ERROR_STOP 1
begin;
create or replace function pg_temp.act(p_sub uuid, p_aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_sub::text, ''), true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.aal', p_aal, true);
end $$;
insert into auth.users (id, email, raw_user_meta_data) values
  ('e0000000-0000-0000-0000-00000000000a', 'w-admin@safeer.sa', '{}'),
  ('e0000000-0000-0000-0000-00000000000f', 'w-factory@safeer.sa', '{"requested_panel":"factory"}'),
  ('e0000000-0000-0000-0000-00000000000c', 'w-amb@safeer.sa', '{"requested_panel":"ambassador"}'),
  ('e0000000-0000-0000-0000-00000000000b', 'w-buyer@example.id', '{"phone":"+62 812 0000 111"}');
insert into public.user_roles values ('e0000000-0000-0000-0000-00000000000a', 'admin', null, now());

-- ── weights
do $$ begin
  begin
    insert into public.products (id, factory_id, category_id, name_ar, price, stock, active) values ('w-none', 'hasa', 'dates', 'بلا وزن', 10, 1, false);
    raise exception 'FAIL: product without a weight';
  exception when not_null_violation or check_violation then null; end;
  begin
    insert into public.products (id, factory_id, category_id, name_ar, price, weight_kg, stock, active) values ('w-bad', 'hasa', 'dates', 'وزن خاطئ', 10, 0.001, 1, false);
    raise exception 'FAIL: 1 g packed weight accepted';
  exception when check_violation then null; end;
end $$;
insert into public.products (id, factory_id, category_id, name_ar, price, weight_kg, stock, active) values ('w-heavy', 'hasa', 'dates', 'كرتون تمر', 50, 12, 100, false);
update public.products set active = true where id = 'w-heavy';
do $$ begin
  assert (select weight_checked_at is not null from public.products where id = 'w-heavy'), 'publishing stamps the weight check';
end $$;
update public.products set weight_kg = 11 where id = 'w-heavy';
do $$ begin
  assert (select weight_checked_at is null from public.products where id = 'w-heavy'), 'changing the weight clears the check';
end $$;
set local role authenticated;
select pg_temp.act('e0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ begin
  assert (select outlier from public.admin_product_weights where id = 'w-heavy'), '11 kg among 1 kg dates is flagged';
  assert not (select outlier from public.admin_product_weights where id = 'dates-khalas'), 'normal weight not flagged';
end $$;
select pg_temp.act('e0000000-0000-0000-0000-00000000000b');
do $$ begin assert (select count(*) from public.admin_product_weights) = 0, 'buyers see no weight review'; end $$;
reset role;

-- ── a guest order with WhatsApp consent, shipped from the warehouse
insert into public.customers (id, email_hash, country) values ('c0000000-0000-0000-0000-0000000000e1', 'we1', 'id');
insert into public.orders (id, customer_id, buyer_user_id, buyer_email, buyer_phone, whatsapp_opt_in, channel, country, incoterm, customs_party, ship_method, goods, shipping, total, settings_version, return_days)
values ('SFR-WA-1', 'c0000000-0000-0000-0000-0000000000e1', null, 'pilgrim@example.id', '+62 811 222 333', true, 'retail', 'id', 'DDP', 'platform', 'express', 178, 60, 238, 1, 14);
insert into public.sub_orders (id, order_id, factory_id, goods, take_rate, take, new_customer) values ('SFR-WA-1-1', 'SFR-WA-1', 'hasa', 178, 0.18, 32, true);
insert into public.order_items (sub_order_id, product_id, qty, unit_price, line_total) values ('SFR-WA-1-1', 'dates-khalas', 2, 89, 178);
select set_config('request.jwt.claim.role', 'service_role', true);
select public.confirm_payment('SFR-WA-1', 6);
update public.factories set owner_id = 'e0000000-0000-0000-0000-00000000000f' where id = 'hasa';
set local role authenticated;
select pg_temp.act('e0000000-0000-0000-0000-00000000000f');
select public.factory_handover('SFR-WA-1-1', 'T-1');
select pg_temp.act('e0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ declare sid uuid; gap numeric; wh text := (select warehouse_id from public.sub_orders where id = 'SFR-WA-1-1'); begin
  perform public.wh_receive('SFR-WA-1-1');
  perform public.wh_inspect('SFR-WA-1-1', true, null);
  sid := public.wh_create_shipment(wh, array['SFR-WA-1-1'], 'aramex', 'express');
  gap := public.record_measured_weight(sid, 2.1);
  assert abs(gap - 0.05) < 0.001, 'small gap returned';
  assert not exists (select 1 from public.notifications where kind = 'weight.mismatch'), 'no alert under 20%';
  gap := public.record_measured_weight(sid, 3.2);
  assert gap > 0.2, 'large gap';
  assert exists (select 1 from public.notifications where kind = 'weight.mismatch' and body like '%تمر خلاص%'), 'admins told which products';
  perform public.shipment_label(sid, 'ARX-WA-1', null, null, null);
  perform public.record_shipment_event(sid, 'in_transit', now(), 'Departed', 'Jeddah');
  perform public.record_shipment_event(sid, 'delivered', now(), 'Delivered', 'Jakarta');
end $$;
reset role;
do $$ declare n public.notifications; begin
  select * into n from public.notifications where kind = 'order.shipped' and email = 'pilgrim@example.id';
  assert n.id is not null, 'guest told the order shipped';
  assert n.body like '%ARX-WA-1%', 'tracking number in the message';
  assert n.data ->> 'phone' = '+62 811 222 333' and (n.data ->> 'whatsapp')::boolean, 'phone and consent travel with it';
  assert n.data ->> 'carrier' = 'أرامكس', 'carrier name';
  assert exists (select 1 from public.notifications where kind = 'order.paid' and email = 'pilgrim@example.id' and data ? 'invoice'),
    'payment confirmation with the invoice number';
  assert exists (select 1 from public.notifications where kind = 'order.delivered' and email = 'pilgrim@example.id' and data ->> 'return_days' = '14'),
    'delivery notice with return window';
  assert (select count(*) from public.whatsapp_templates where active) = 0, 'templates stay off until approved';
end $$;

-- account holders: phone from the profile, consent off by default
select public.notify('e0000000-0000-0000-0000-00000000000b', 'group.message', 't', 'b');
do $$ begin
  assert (select data ->> 'whatsapp' from public.notifications where user_id = 'e0000000-0000-0000-0000-00000000000b' order by id desc limit 1) = 'false',
    'no WhatsApp without opt-in';
end $$;

-- ── test accounts: refused unless the project flag is on, never for clients
do $$ begin
  begin perform public.provision_test_accounts('e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000f',
                                               'e0000000-0000-0000-0000-00000000000c', 'e0000000-0000-0000-0000-00000000000b');
    raise exception 'FAIL: provisioned with the flag off';
  exception when others then if sqlerrm not like '%disabled%' then raise; end if; end;
end $$;
insert into public.app_flags values ('test_accounts', 'true');
set local role authenticated;
select pg_temp.act('e0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ begin
  begin perform public.provision_test_accounts('e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000f',
                                               'e0000000-0000-0000-0000-00000000000c', 'e0000000-0000-0000-0000-00000000000b');
    raise exception 'FAIL: an admin session provisioned test accounts';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.role', 'service_role', true);
do $$ declare r jsonb; begin
  r := public.provision_test_accounts('e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000f',
                                      'e0000000-0000-0000-0000-00000000000c', 'e0000000-0000-0000-0000-00000000000b');
  assert r ->> 'factory_id' = 'hasa', 'factory linked';
  assert (select owner_id from public.factories where id = 'hasa') = 'e0000000-0000-0000-0000-00000000000f', 'owner set';
  assert (select kyb_status::text from public.factories where id = 'hasa') = 'verified', 'factory verified';
  assert public.kyb_missing('hasa') = '{}', 'placeholder documents cover the requirements';
  assert exists (select 1 from public.ambassadors where user_id = 'e0000000-0000-0000-0000-00000000000c' and code = 'TEST-AMB' and is_leader), 'leader ambassador';
  assert (select count(*) from public.user_roles where user_id in ('e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000f', 'e0000000-0000-0000-0000-00000000000c')
          and role in ('admin', 'factory', 'ambassador')) = 3, 'panel roles granted';
  perform public.unprovision_test_accounts(array['e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000f', 'e0000000-0000-0000-0000-00000000000c']::uuid[]);
  assert (select owner_id from public.factories where id = 'hasa') is null, 'factory released';
  assert not exists (select 1 from public.user_roles where user_id = 'e0000000-0000-0000-0000-00000000000a' and role = 'admin'), 'admin role removed';
end $$;
rollback;
\echo 'WEIGHTS + WHATSAPP + TEST ACCOUNT CHECKS PASSED'
