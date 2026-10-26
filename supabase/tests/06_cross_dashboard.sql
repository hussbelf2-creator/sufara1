-- One story across all four dashboards:
-- factory approved → product published → ambassador link → buyer RFQ via click →
-- factory quote → deal → instalments → order paid → commission → delivery →
-- settlement → factory paid → ambassador paid; plus returns, groups, leader team.
\set ON_ERROR_STOP 1
begin;
create or replace function pg_temp.act(p_sub uuid, p_aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_sub::text, ''), true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.aal', p_aal, true);
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('80000000-0000-0000-0000-00000000000a', 'boss@safeer.sa', '{}'),
  ('80000000-0000-0000-0000-00000000000f', 'owner@honey.sa', '{"full_name":"Majed","requested_panel":"factory","company":"Asir Honey Co"}'),
  ('80000000-0000-0000-0000-00000000000b', 'agent@umrah.example', '{"full_name":"Agent","requested_panel":"ambassador"}'),
  ('80000000-0000-0000-0000-00000000000c', 'pilgrim@example.com', '{"full_name":"Pilgrim Ali","requested_panel":"ambassador"}'),
  ('80000000-0000-0000-0000-00000000000d', 'trader@karachi.pk', '{"full_name":"Trader"}');
insert into public.user_roles values ('80000000-0000-0000-0000-00000000000a', 'admin', null, now());

set local role authenticated;
select pg_temp.act('80000000-0000-0000-0000-00000000000a', 'aal2');
select public.admin_set_verification('80000000-0000-0000-0000-00000000000f', 'verified');
select public.admin_set_verification('80000000-0000-0000-0000-00000000000b', 'verified');
-- approval creates the factory as pending; documents make it verified
select pg_temp.act('80000000-0000-0000-0000-00000000000f');
insert into public.factory_documents (factory_id, type_code, storage_path, file_name, uploaded_by)
select f.id, t.code, f.id || '/' || t.code || '.pdf', t.code || '.pdf', auth.uid()
from public.factories f cross join public.document_types t where f.owner_id = auth.uid() and t.required;
select pg_temp.act('80000000-0000-0000-0000-00000000000a', 'aal2');
select public.admin_review_document(id, 'approved') from public.factory_documents;
do $$ begin
  assert exists (select 1 from public.factories where owner_id = '80000000-0000-0000-0000-00000000000f' and kyb_status = 'verified'), '1. approval + documents verify the factory';
  assert exists (select 1 from public.user_roles where user_id = '80000000-0000-0000-0000-00000000000f' and role = 'factory'), 'factory role';
end $$;
select public.admin_set_leader('80000000-0000-0000-0000-00000000000b', true);

-- pilgrim joins the agent's team through the invite
reset role;
update public.profiles set leader_id = '80000000-0000-0000-0000-00000000000b' where id = '80000000-0000-0000-0000-00000000000c';
set local role authenticated;
select pg_temp.act('80000000-0000-0000-0000-00000000000a', 'aal2');
select public.admin_set_verification('80000000-0000-0000-0000-00000000000c', 'verified');

-- factory adds a product (draft), admin publishes it
select pg_temp.act('80000000-0000-0000-0000-00000000000f');
insert into public.products (id, factory_id, category_id, name_ar, price, weight_kg, moq, tiers, active)
select 'honey-sidr', id, 'honey', 'عسل سدر', 220, 1, 20, '[{"min":20,"max":0,"price":180}]', false
from public.factories where owner_id = auth.uid();
do $$ begin
  begin
    update public.products set active = true where id = 'honey-sidr';
    assert not (select active from public.products where id = 'honey-sidr'), 'factory cannot self-publish';
  exception when others then null; end;
end $$;
select pg_temp.act('80000000-0000-0000-0000-00000000000a', 'aal2');
select public.admin_publish_product('honey-sidr', true);

-- ambassador creates a page link; the public page resolves it
select pg_temp.act('80000000-0000-0000-0000-00000000000c');
do $$ declare c text; fid text := (select id from public.factories where owner_id = '80000000-0000-0000-0000-00000000000f'); p jsonb;
begin
  c := public.create_referral_link(fid);
  assert c = public.create_referral_link(fid), '2. link is stable';
  set local role anon;
  p := public.ambassador_page((select slug from public.ambassadors where user_id = '80000000-0000-0000-0000-00000000000c'), fid);
  assert p ->> 'code' = c and p ->> 'name' = 'Pilgrim', 'public page shows first name + code';
  set local role authenticated;
end $$;

-- a click, then the trader's RFQ attributed on the server
reset role;
insert into public.clicks (id, ambassador_id, factory_id, ip_hash, ua_hash)
values ('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-00000000000c', (select id from public.factories where owner_id = '80000000-0000-0000-0000-00000000000f'), 'i', 'u');
set local role authenticated;
select pg_temp.act('80000000-0000-0000-0000-00000000000d');
do $$ declare rid uuid; begin
  begin
    insert into public.rfqs (buyer_user_id, product_id, qty, country, incoterm, ambassador_id)
    values (auth.uid(), 'honey-sidr', 100, 'pk', 'CIF', '80000000-0000-0000-0000-00000000000c');
    raise exception 'FAIL: buyer attributed an RFQ directly';
  exception when insufficient_privilege or check_violation then null; end;
  rid := public.create_rfq('honey-sidr', null, 100, 'pk', 'Karachi', 'CIF', 'Ramadan stock', '90000000-0000-0000-0000-000000000001');
  assert (select ambassador_id from public.rfqs where id = rid) = '80000000-0000-0000-0000-00000000000c', '3. RFQ attributed from the click';
end $$;

select pg_temp.act('80000000-0000-0000-0000-00000000000f');
select public.submit_quote((select id from public.rfqs limit 1), (select id from public.factories where owner_id = auth.uid()), 175, 20, '30/70', current_date + 10);

select pg_temp.act('80000000-0000-0000-0000-00000000000d');
select public.accept_quote((select id from public.quotes limit 1));
do $$ begin
  assert (select o.channel from public.deals d join public.orders o on o.id = d.order_id) = 'wholesale', '4. deal became a wholesale order';
  assert (select total from public.orders) = 17500, 'order total = quote × qty';
  assert (select status::text from public.orders) = 'pending_payment', 'awaits instalments';
end $$;

select pg_temp.act('80000000-0000-0000-0000-00000000000a', 'aal2');
do $$ declare d uuid := (select id from public.deals limit 1); begin
  assert public.admin_record_instalment(d, 1, 'TRX-1') = 'instalment recorded', 'first instalment';
  assert (select status::text from public.orders) = 'pending_payment', 'still unpaid after 30%';
  assert public.admin_record_instalment(d, 2, 'TRX-2') = 'deal fully paid', 'second instalment';
  assert (select status::text from public.orders) = 'paid', 'order paid';
  assert (select amount from public.commissions where kind = 'ambassador') = 350, 'wholesale 2% commission';
  assert (select amount from public.commissions where kind = 'leader') = 175, 'leader 1%';
  assert (select coalesce(sum(credit) - sum(debit), 0) from public.ledger_entries where account = 'liability:deal_deposits') = 0, 'deposits cleared';
  assert (select sum(debit) - sum(credit) from public.ledger_entries) = 0, 'ledger balanced';
end $$;

-- delivery, window passes, settlement, factory paid
select public.record_shipment((select id from public.sub_orders limit 1), 'delivered', now() - interval '40 days');
select public.run_commission_engine();
do $$ declare fid text := (select id from public.factories where owner_id = '80000000-0000-0000-0000-00000000000f'); b jsonb; paid numeric;
begin
  b := public.factory_balance(fid);
  assert (b ->> 'due')::numeric = 16450, '5. factory due = 17500 − 6% take';
  paid := public.admin_pay_factory(fid, 'SARIE-123');
  assert paid = 16450, 'factory paid';
  assert (public.factory_balance(fid) ->> 'due')::numeric = 0, 'nothing left due';
  begin perform public.admin_pay_factory(fid, 'again'); raise exception 'FAIL: double factory payout';
  exception when others then if sqlerrm not like '%nothing due%' then raise; end if; end;
  assert (select sum(debit) - sum(credit) from public.ledger_entries) = 0, 'ledger balanced after settlement';
end $$;

-- leader sees the team (one level)
select pg_temp.act('80000000-0000-0000-0000-00000000000b');
do $$ begin
  assert (select count(*) from public.my_team()) = 1, '8. leader sees the member';
  assert (select leader_bonus from public.my_team()) = 175, 'leader bonus per member';
end $$;

-- group order
select pg_temp.act('80000000-0000-0000-0000-00000000000c');
do $$ declare g text; begin
  g := public.create_group_order('pk', 'Karachi', 7);
  assert (public.resolve_group(g) ->> 'min')::int = 5, '6. group resolves';
end $$;

-- return flow on a retail order
reset role;
insert into public.orders (id, customer_id, buyer_user_id, channel, status, country, incoterm, customs_party, ship_method, goods, total, settings_version, return_days, paid_at)
select 'SFR-R-1', id, '80000000-0000-0000-0000-00000000000d', 'retail', 'paid', 'pk', 'DDP', 'platform', 'express', 440, 500, 1, 14, now()
from public.customers limit 1;
insert into public.sub_orders (id, order_id, factory_id, goods, take_rate, take, new_customer, status, delivered_at)
select 'SFR-R-1-1', 'SFR-R-1', id, 440, 0.18, 79, false, 'delivered', now() - interval '2 days'
from public.factories where owner_id = '80000000-0000-0000-0000-00000000000f';
select set_config('request.jwt.claim.role', 'service_role', true);
select public.post_txn('payment captured', 'SFR-R-1', '[{"account":"asset:gateway_clearing","debit":500},{"account":"liability:customer_escrow","credit":440},{"account":"liability:carrier_payable","credit":60}]');
set local role authenticated;
select pg_temp.act('80000000-0000-0000-0000-00000000000d');
select public.request_return('SFR-R-1-1', 'damaged', 'Box crushed');
select pg_temp.act('80000000-0000-0000-0000-00000000000a', 'aal2');
do $$ declare rid bigint := (select id from public.return_requests limit 1); begin
  perform public.admin_decide_return(rid, 'approved');
  assert (select (public.run_commission_engine() ->> 'settled')::int) = 0, '7. open return blocks settlement';
  perform public.admin_decide_return(rid, 'received');
  assert (select status::text from public.sub_orders where id = 'SFR-R-1-1') = 'refunded', 'refunded';
  assert (select sum(debit) - sum(credit) from public.ledger_entries) = 0, 'ledger balanced after return';
  assert (select count(*) from public.admin_orders) = 2 and (select count(*) from public.admin_returns) = 1, '9. admin read models';
end $$;
rollback;
\echo 'CROSS-DASHBOARD CHECKS PASSED'
