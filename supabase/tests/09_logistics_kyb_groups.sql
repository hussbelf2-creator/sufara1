-- Warehouses, shipments and tracking, KYB documents, notifications, group expiry.
\set ON_ERROR_STOP 1
begin;
create or replace function pg_temp.act(p_sub uuid, p_aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_sub::text, ''), true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.aal', p_aal, true);
end $$;
insert into auth.users (id, email, raw_user_meta_data) values
  ('b0000000-0000-0000-0000-00000000000a', 'ops@safeer.sa', '{}'),
  ('b0000000-0000-0000-0000-00000000000f', 'owner@new.sa', '{"full_name":"Owner","requested_panel":"factory","company":"Qassim Dates"}'),
  ('b0000000-0000-0000-0000-00000000000b', 'buyer1@example.pk', '{}'),
  ('b0000000-0000-0000-0000-00000000000c', 'buyer2@example.pk', '{}');
insert into public.user_roles values ('b0000000-0000-0000-0000-00000000000a', 'admin', null, now());

-- ── KYB: pending until required documents are approved; admin manages types
set local role authenticated;
select pg_temp.act('b0000000-0000-0000-0000-00000000000a', 'aal2');
select public.admin_set_verification('b0000000-0000-0000-0000-00000000000f', 'verified');
insert into public.document_types (code, name_ar, name_en, required) values ('cold_chain', 'شهادة سلسلة التبريد', 'Cold-chain certificate', false);
update public.document_types set required = false where code = 'halal';          -- admin relaxes a requirement
do $$ declare fid text := (select id from public.factories where owner_id = 'b0000000-0000-0000-0000-00000000000f'); begin
  assert (select kyb_status::text from public.factories where id = fid) = 'pending', 'KYB pending after account approval';
  assert public.kyb_missing(fid) = array['cr', 'industrial_license'], 'missing required docs listed';
  assert (select default_warehouse_id from public.factories where id = fid) = 'jed-1', 'default warehouse assigned';
end $$;
select pg_temp.act('b0000000-0000-0000-0000-00000000000f');
do $$ declare fid text := (select id from public.factories where owner_id = auth.uid()); begin
  begin
    insert into public.factory_documents (factory_id, type_code, storage_path, file_name, uploaded_by, status)
    values (fid, 'cr', fid || '/cr.pdf', 'cr.pdf', auth.uid(), 'approved');
    raise exception 'FAIL: factory self-approved a document';
  exception when insufficient_privilege or check_violation then null; end;
  insert into public.factory_documents (factory_id, type_code, storage_path, file_name, expires_on, uploaded_by)
  values (fid, 'cr', fid || '/cr.pdf', 'cr.pdf', current_date + 300, auth.uid()),
         (fid, 'industrial_license', fid || '/il.pdf', 'il.pdf', current_date - 1, auth.uid());
end $$;
select pg_temp.act('b0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ declare fid text := (select id from public.factories where owner_id = 'b0000000-0000-0000-0000-00000000000f'); begin
  assert (select count(*) from public.notifications where audience = 'admins' and kind = 'kyb.uploaded') = 2, 'admins notified of uploads';
  begin perform public.admin_review_document((select id from public.factory_documents where type_code = 'cr'), 'rejected', '');
    raise exception 'FAIL: rejection without reason';
  exception when others then if sqlerrm not like '%reason%' then raise; end if; end;
  assert public.admin_review_document((select id from public.factory_documents where type_code = 'cr'), 'approved') = 'pending', 'still missing one';
  assert public.admin_review_document((select id from public.factory_documents where type_code = 'industrial_license'), 'approved') = 'pending', 'expired licence does not count';
end $$;
select pg_temp.act('b0000000-0000-0000-0000-00000000000f');
insert into public.factory_documents (factory_id, type_code, storage_path, file_name, expires_on, uploaded_by)
select id, 'industrial_license', id || '/il2.pdf', 'il2.pdf', current_date + 200, auth.uid() from public.factories where owner_id = auth.uid();
select pg_temp.act('b0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ begin
  assert public.admin_review_document((select max(id) from public.factory_documents), 'approved') = 'verified', 'KYB verified';
end $$;

-- ── warehouses: a second location, routing, handover, inspection, shipment
insert into public.warehouses (id, name_ar, name_en, city) values ('dmm-1', 'مستودع الدمام', 'Dammam', 'الدمام');
reset role;
update public.factories set default_warehouse_id = 'dmm-1', owner_id = 'b0000000-0000-0000-0000-00000000000f' where id = 'hasa';
insert into public.customers (id, email_hash, country) values ('c0000000-0000-0000-0000-000000000001', 'b1', 'pk'), ('c0000000-0000-0000-0000-000000000002', 'b2', 'pk');
insert into public.group_orders (id, code, country, min_participants, closes_at, participants)
values ('d0000000-0000-0000-0000-000000000001', 'G-TEST1', 'pk', 5, now() - interval '1 hour', 2);
insert into public.orders (id, customer_id, buyer_user_id, buyer_email, channel, country, incoterm, customs_party, ship_method, goods, shipping, total, settings_version, return_days, group_order_id)
values ('SFR-W-1', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000b', 'buyer1@example.pk', 'retail', 'pk', 'DDP', 'platform', 'group', 300, 80, 380, 1, 14, 'd0000000-0000-0000-0000-000000000001'),
       ('SFR-W-2', 'c0000000-0000-0000-0000-000000000002', null, 'guest@example.pk', 'retail', 'pk', 'DDP', 'platform', 'group', 200, 60, 260, 1, 14, 'd0000000-0000-0000-0000-000000000001');
insert into public.sub_orders (id, order_id, factory_id, goods, take_rate, take, new_customer) values
  ('SFR-W-1-1', 'SFR-W-1', 'hasa', 300, 0.18, 54, true), ('SFR-W-2-1', 'SFR-W-2', 'hasa', 200, 0.18, 36, true);
select set_config('request.jwt.claim.role', 'service_role', true);
select public.confirm_payment('SFR-W-1', 10);
select public.confirm_payment('SFR-W-2', 8);
do $$ begin
  assert (select warehouse_id from public.sub_orders where id = 'SFR-W-1-1') = 'dmm-1', 'routed to the factory warehouse';
  assert exists (select 1 from public.notifications where user_id = 'b0000000-0000-0000-0000-00000000000f' and kind = 'order.handover'), 'factory told to hand over';
end $$;

set local role authenticated;
select pg_temp.act('b0000000-0000-0000-0000-00000000000f');
select public.factory_handover('SFR-W-1-1', 'TRUCK-22');
select public.factory_handover('SFR-W-2-1', 'TRUCK-22');
select pg_temp.act('b0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ declare sid uuid; begin
  begin perform public.wh_inspect('SFR-W-1-1', true, null); raise exception 'FAIL: inspected before receiving';
  exception when others then if sqlerrm not like '%receive%' then raise; end if; end;
  perform public.wh_receive('SFR-W-1-1'); perform public.wh_receive('SFR-W-2-1');
  perform public.wh_inspect('SFR-W-2-1', false, 'carton crushed');
  begin perform public.wh_create_shipment('dmm-1', array['SFR-W-1-1', 'SFR-W-2-1'], 'aramex', 'express');
    raise exception 'FAIL: packed a failed item';
  exception when others then if sqlerrm not like '%inspected%' then raise; end if; end;
  perform public.wh_inspect('SFR-W-2-1', true, 'repacked');
  perform public.wh_inspect('SFR-W-1-1', true, null);
  sid := public.wh_create_shipment('dmm-1', array['SFR-W-1-1', 'SFR-W-2-1'], 'aramex', 'express');
  assert (select kind from public.shipments where id = sid) = 'group', 'group parcel';
  begin perform public.record_shipment_event(sid, 'in_transit'); raise exception 'FAIL: event before label';
  exception when others then if sqlerrm not like '%label%' then raise; end if; end;
  perform public.shipment_label(sid, 'ARX123', 'https://label/1.pdf', 'prov-1', 85);
  perform public.record_shipment_event(sid, 'in_transit', now() - interval '20 days', 'Departed Dammam', 'Dammam');
  assert (select status::text from public.sub_orders where id = 'SFR-W-1-1') = 'dispatched', 'sub-orders dispatched by the carrier event';
  perform public.record_shipment_event(sid, 'delivered', now() - interval '15 days', 'Delivered', 'Karachi');
  assert (select delivered_at is not null from public.sub_orders where id = 'SFR-W-2-1'), 'delivery reaches the sub-orders';
  assert (select count(*) from public.shipment_events where shipment_id = sid) = 3, 'event history';
end $$;
select pg_temp.act('b0000000-0000-0000-0000-00000000000b');
do $$ begin
  assert (select count(*) from public.shipment_events) = 3, 'buyer sees their tracking events';
end $$;

-- ── group expiry → admins → message → decision
reset role;
insert into public.group_orders (id, code, country, min_participants, closes_at, participants)
values ('d0000000-0000-0000-0000-000000000002', 'G-SHORT', 'pk', 5, now() - interval '1 hour', 1);
insert into public.orders (id, customer_id, buyer_user_id, buyer_email, channel, country, incoterm, customs_party, ship_method, goods, shipping, total, settings_version, return_days, group_order_id)
values ('SFR-G-1', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000c', 'buyer2@example.pk', 'retail', 'pk', 'DDP', 'platform', 'group', 300, 80, 380, 1, 14, 'd0000000-0000-0000-0000-000000000002');
insert into public.sub_orders (id, order_id, factory_id, goods, take_rate, take, new_customer) values ('SFR-G-1-1', 'SFR-G-1', 'hasa', 300, 0.18, 54, false);
select set_config('request.jwt.claim.role', 'service_role', true);
select public.confirm_payment('SFR-G-1', 10);
do $$ declare r jsonb; begin
  r := public.run_nightly();
  assert (r ->> 'groups_awaiting_decision')::int = 2, 'both short groups flagged';
  assert (select status from public.group_orders where code = 'G-SHORT') = 'awaiting_decision', 'awaiting decision';
  assert (select count(*) from public.notifications where audience = 'admins' and kind = 'group.short') = 2, 'admins notified';
end $$;
set local role authenticated;
select pg_temp.act('b0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ begin
  assert public.admin_group_message('d0000000-0000-0000-0000-000000000002', 'تأخر اكتمال المجموعة', 'نراجع الخيارات وسنعود إليكم خلال يوم') = 1, 'message to the buyer';
  assert public.admin_resolve_group('d0000000-0000-0000-0000-000000000002', 'cancel', null, 'إلغاء الطلب الجماعي', 'تم استرداد المبلغ كاملًا') = 1, 'decision sent';
  assert (select status::text from public.orders where id = 'SFR-G-1') = 'refunded', 'cancel refunds paid orders';
  assert (select sum(debit) - sum(credit) from public.ledger_entries) = 0, 'ledger balanced';
  assert public.admin_resolve_group('d0000000-0000-0000-0000-000000000001', 'extend', 5, 'تمديد', 'مددنا الموعد ٥ أيام') = 2, 'extend notifies account + guest';
end $$;
select pg_temp.act('b0000000-0000-0000-0000-00000000000c');
do $$ begin
  assert (select count(*) from public.notifications where kind like 'group.%') = 2, 'buyer gets both group messages';
  assert not exists (select 1 from public.notifications where user_id is distinct from auth.uid()), 'buyer reads own messages only';
  perform public.mark_notifications_read(array(select id from public.notifications));
  assert (select count(*) from public.notifications where read_at is null) = 0, 'marked read';
end $$;
reset role;
do $$ begin
  assert exists (select 1 from public.notifications where user_id = 'b0000000-0000-0000-0000-00000000000f' and kind = 'kyb.required'), 'owner told to upload';
  assert exists (select 1 from public.notifications where kind = 'warehouse.inspection_failed'), 'factory told about the failure';
  assert exists (select 1 from public.notifications where kind = 'kyb.verified'), 'owner told the factory is verified';
  assert (select count(*) from public.notifications where email = 'guest@example.pk' and kind = 'group.message') = 1, 'guest gets an e-mail notification';
end $$;
rollback;
\echo 'LOGISTICS + KYB + GROUP CHECKS PASSED'
