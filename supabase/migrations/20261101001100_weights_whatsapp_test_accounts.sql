-- Migration 011
--  • Product weights: a packed weight is required and bounded, publishing
--    stamps it as checked, an outlier view flags weights far from their
--    category, and the warehouse scale weight is compared with the catalogue
--    (a gap over 20% is sent to the admins with the products involved).
--  • Buyers are told when their order ships, is delayed and is delivered.
--  • WhatsApp: opt-in on the profile and at checkout, admin-managed mapping
--    from notification kinds to Meta-approved templates, delivery status.
--  • Test accounts: one server-only function provisions an admin, a factory,
--    an ambassador and a buyer — refused unless the project's app_flags row
--    'test_accounts' is switched on (never on production).

-- ── product weights ────────────────────────────────────────────────────
alter table public.products add column if not exists weight_checked_at timestamptz;
alter table public.products alter column weight_kg drop default;

create or replace function public.guard_product_weight() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.weight_kg is distinct from old.weight_kg then
    if new.weight_kg is null or new.weight_kg < 0.01 or new.weight_kg > 70 then
      raise exception 'packed weight must be between 0.01 and 70 kg' using errcode = '23514';
    end if;
    new.weight_checked_at := null;
  end if;
  -- Publishing is the admin's check of the weight (shown with the outlier flag).
  if new.active and (tg_op = 'INSERT' or not old.active) then
    new.weight_checked_at := now();
  end if;
  return new;
end $$;
drop trigger if exists products_weight_guard on public.products;
create trigger products_weight_guard before insert or update of weight_kg, active on public.products
  for each row execute function public.guard_product_weight();

create or replace view public.admin_product_weights with (security_barrier = true) as
  with med as (
    select category_id, percentile_cont(0.5) within group (order by weight_kg) as median, count(*) as n
    from public.products where active group by category_id
  )
  select p.id, p.category_id, p.weight_kg, p.weight_checked_at, med.median as category_median,
         coalesce(med.n >= 3 and (p.weight_kg > med.median * 3 or p.weight_kg < med.median / 3), false) as outlier
  from public.products p left join med on med.category_id = p.category_id
  where public.is_admin();
grant select on public.admin_product_weights to authenticated;

alter table public.shipments add column if not exists measured_weight_kg numeric(10, 3);
alter table public.shipments add column if not exists catalogue_weight_kg numeric(10, 3);

create or replace function public.record_measured_weight(p_shipment uuid, p_kg numeric) returns numeric
language plpgsql security definer set search_path = public as $$
declare cat numeric; gap numeric; names text;
begin
  perform public.require_server();
  if p_kg is null or p_kg <= 0 then raise exception 'measured weight must be positive'; end if;
  select coalesce(sum(i.qty * p.weight_kg), 0), string_agg(distinct p.name_ar || ' (' || p.weight_kg || ' كجم)', '، ')
    into cat, names
  from public.shipment_items si
  join public.order_items i on i.sub_order_id = si.sub_order_id
  join public.products p on p.id = i.product_id
  where si.shipment_id = p_shipment;
  update public.shipments set measured_weight_kg = p_kg, catalogue_weight_kg = cat where id = p_shipment;
  if not found then raise exception 'unknown shipment'; end if;
  gap := case when cat > 0 then round((p_kg - cat) / cat, 3) else null end;
  if gap is not null and abs(gap) > 0.2 then
    perform public.notify_admins('weight.mismatch', 'فرق في وزن شحنة',
      'الميزان ' || p_kg || ' كجم مقابل ' || round(cat, 2) || ' كجم في الكتالوج (' || round(gap * 100) || '٪). راجع أوزان: ' || coalesce(names, ''),
      '/dashboard?mode=admin&view=admin-products', jsonb_build_object('shipment', p_shipment, 'measured', p_kg, 'catalogue', cat));
  end if;
  return gap;
end $$;
revoke execute on function public.record_measured_weight(uuid, numeric) from public, anon;
grant execute on function public.record_measured_weight(uuid, numeric) to authenticated, service_role;

-- ── WhatsApp opt-in and delivery status ────────────────────────────────
alter table public.profiles add column if not exists whatsapp_opt_in boolean not null default false;
alter table public.orders add column if not exists whatsapp_opt_in boolean not null default false;
alter table public.notifications add column if not exists whatsapp_at timestamptz;
alter table public.notifications add column if not exists whatsapp_status text;

-- The buyer's phone and consent travel with the notification, so the
-- dispatcher can reach guests (who have no profile) too.
create or replace function public.notification_contact() returns trigger
language plpgsql security definer set search_path = public as $$
declare phone text; consent boolean;
begin
  if new.audience <> 'user' or new.data ? 'phone' then return new; end if;
  if new.data ? 'order' then
    select o.buyer_phone, o.whatsapp_opt_in into phone, consent from public.orders o where o.id = new.data ->> 'order';
  end if;
  if phone is null and new.user_id is not null then
    select p.phone, p.whatsapp_opt_in into phone, consent from public.profiles p where p.id = new.user_id;
  end if;
  if phone is not null then
    new.data := new.data || jsonb_build_object('phone', phone, 'whatsapp', coalesce(consent, false));
  end if;
  return new;
end $$;
drop trigger if exists notifications_contact on public.notifications;
create trigger notifications_contact before insert on public.notifications
  for each row execute function public.notification_contact();

create table if not exists public.whatsapp_templates (
  kind text primary key,
  template_name text not null,
  lang text not null default 'ar',
  params text[] not null default '{title,body}',   -- title | body | link | data.<key>
  active boolean not null default false,            -- switch on once Meta approves the template
  sample text,
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_templates enable row level security;
drop policy if exists wa_admin on public.whatsapp_templates;
create policy wa_admin on public.whatsapp_templates for all using (public.is_admin()) with check (public.is_admin());

insert into public.whatsapp_templates (kind, template_name, params, sample) values
  ('order.paid', 'safeer_order_paid', '{data.order,data.invoice}',
   'سفير: استلمنا الدفع لطلبك {{1}}. رقم الفاتورة الضريبية: {{2}}. سنبلغك عند الشحن.'),
  ('order.shipped', 'safeer_order_shipped', '{data.order,data.carrier,data.tracking}',
   'سفير: طلبك {{1}} في الطريق مع {{2}}. رقم التتبع: {{3}}'),
  ('order.delivered', 'safeer_order_delivered', '{data.order,data.return_days}',
   'سفير: تم تسليم طلبك {{1}}. يمكنك طلب الإرجاع خلال {{2}} يومًا من صفحة طلباتك.'),
  ('order.delayed', 'safeer_order_delayed', '{data.order,data.tracking}',
   'سفير: نعتذر، تأخرت شحنة طلبك {{1}} (تتبع {{2}}). فريقنا يتابع مع الناقل وسنبلغك بالجديد.'),
  ('group.message', 'safeer_group_update', '{title,body}',
   'سفير — الطلب الجماعي: {{1}}\n{{2}}'),
  ('order.handover', 'safeer_factory_update', '{title,body}', 'سفير للمصانع: {{1}}\n{{2}}'),
  ('warehouse.inspection_failed', 'safeer_factory_update', '{title,body}', 'سفير للمصانع: {{1}}\n{{2}}'),
  ('kyb.required', 'safeer_factory_update', '{title,body}', 'سفير للمصانع: {{1}}\n{{2}}'),
  ('kyb.expiring', 'safeer_factory_update', '{title,body}', 'سفير للمصانع: {{1}}\n{{2}}'),
  ('kyb.suspended', 'safeer_factory_update', '{title,body}', 'سفير للمصانع: {{1}}\n{{2}}'),
  ('kyb.new_requirement', 'safeer_factory_update', '{title,body}', 'سفير للمصانع: {{1}}\n{{2}}')
on conflict (kind) do nothing;

-- ── buyers hear about their parcel ─────────────────────────────────────
create or replace function public.shipment_buyer_notice() returns trigger
language plpgsql security definer set search_path = public as $$
declare o record; carrier text; kind text; title text; body text;
begin
  if new.status = old.status then return new; end if;
  if new.status = 'in_transit' and old.status in ('draft', 'label_created') then
    kind := 'order.shipped'; title := 'شُحن طلبك';
  elsif new.status = 'delivered' then
    kind := 'order.delivered'; title := 'تم تسليم طلبك';
  elsif new.status = 'exception' then
    kind := 'order.delayed'; title := 'تأخير في شحنتك';
  else
    return new;
  end if;
  select coalesce(c.name_ar, new.carrier_code) into carrier from public.carriers c where c.code = new.carrier_code;
  for o in
    select distinct ord.id, ord.buyer_user_id, ord.buyer_email, ord.return_days
    from public.shipment_items si
    join public.sub_orders s on s.id = si.sub_order_id
    join public.orders ord on ord.id = s.order_id
    where si.shipment_id = new.id
  loop
    body := case kind
      when 'order.shipped' then 'طلبك ' || o.id || ' في الطريق مع ' || coalesce(carrier, new.carrier_code) || '. رقم التتبع: ' || coalesce(new.tracking_no, '—')
      when 'order.delivered' then 'تم تسليم طلبك ' || o.id || '. يمكنك طلب الإرجاع خلال ' || o.return_days || ' يومًا.'
      else 'تأخرت شحنة طلبك ' || o.id || '. نتابع مع الناقل وسنبلغك بالجديد.' end;
    perform public.notify(o.buyer_user_id, kind, title, body,
      case when o.buyer_user_id is null then '/orders' else '/dashboard?mode=buyer&view=orders' end,
      jsonb_build_object('order', o.id, 'tracking', coalesce(new.tracking_no, ''), 'carrier', coalesce(carrier, new.carrier_code),
                         'return_days', o.return_days::text),
      case when o.buyer_user_id is null then o.buyer_email end);
  end loop;
  return new;
end $$;
drop trigger if exists shipments_buyer_notice on public.shipments;
create trigger shipments_buyer_notice after update of status on public.shipments
  for each row execute function public.shipment_buyer_notice();

-- Payment confirmation reaches the buyer once the tax invoice exists
-- (card, bank transfer or the last wholesale instalment alike).
create or replace function public.invoice_buyer_notice() returns trigger
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = new.order_id;
  if o.id is null then return new; end if;
  perform public.notify(o.buyer_user_id, 'order.paid', 'تم تأكيد طلبك',
    'استلمنا الدفع لطلبك ' || o.id || '. رقم الفاتورة الضريبية: ' || new.invoice_no || '. سنبلغك عند الشحن.',
    case when o.buyer_user_id is null then '/orders' else '/dashboard?mode=buyer&view=orders' end,
    jsonb_build_object('order', o.id, 'invoice', new.invoice_no),
    case when o.buyer_user_id is null then o.buyer_email end);
  return new;
end $$;
drop trigger if exists invoices_buyer_notice on public.invoices;
create trigger invoices_buyer_notice after insert on public.invoices
  for each row execute function public.invoice_buyer_notice();

-- ── test accounts (test projects only) ─────────────────────────────────
create table if not exists public.app_flags (key text primary key, value jsonb not null);
alter table public.app_flags enable row level security;   -- no policies: SQL editor / service role only

create or replace function public.test_accounts_enabled() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'true'::jsonb from public.app_flags where key = 'test_accounts'), false);
$$;

create or replace function public.provision_test_accounts(p_admin uuid, p_factory uuid, p_ambassador uuid, p_buyer uuid,
                                                          p_factory_id text default 'hasa') returns jsonb
language plpgsql security definer set search_path = public as $$
declare fid text := p_factory_id; code text := 'TEST-AMB';
begin
  if not (auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not public.test_accounts_enabled() then
    raise exception 'test accounts are disabled on this project (app_flags.test_accounts)';
  end if;

  update public.profiles set verification_status = 'verified', full_name = 'مدير تجريبي' where id = p_admin;
  insert into public.user_roles (user_id, role) values (p_admin, 'admin') on conflict do nothing;

  update public.profiles set verification_status = 'verified', requested_panel = 'factory' where id = p_factory;
  insert into public.user_roles (user_id, role) values (p_factory, 'factory') on conflict do nothing;
  if not exists (select 1 from public.factories where id = fid) then
    insert into public.factories (id, owner_id, name_ar, name_en, city, kyb_status, default_warehouse_id)
    values (fid, p_factory, 'مصنع تجريبي', 'Test factory', 'جدة', 'verified', (select id from public.warehouses where is_default limit 1));
  end if;
  update public.factories set owner_id = p_factory where id = fid;
  -- Approved placeholder documents keep the test factory verified through the nightly sweep.
  insert into public.factory_documents (factory_id, type_code, storage_path, file_name, expires_on, status, note)
  select fid, t.code, fid || '/test-' || t.code || '.pdf', 'test-' || t.code || '.pdf',
         case when t.needs_expiry then current_date + 365 end, 'approved', 'وثيقة تجريبية'
  from public.document_types t
  where t.active and t.required
    and not exists (select 1 from public.factory_documents d where d.factory_id = fid and d.type_code = t.code and d.status = 'approved');
  update public.factories set kyb_status = 'verified' where id = fid;

  update public.profiles set verification_status = 'verified', requested_panel = 'ambassador' where id = p_ambassador;
  insert into public.user_roles (user_id, role) values (p_ambassador, 'ambassador') on conflict do nothing;
  insert into public.ambassadors (user_id, slug, code, is_leader)
  values (p_ambassador, 'test-amb', code, true)
  on conflict (user_id) do update set status = 'active', is_leader = true;

  update public.profiles set whatsapp_opt_in = false where id = p_buyer;
  perform public.audit('test_accounts.provision', 'profiles', p_admin::text,
    jsonb_build_object('factory', fid, 'ambassador', code));
  return jsonb_build_object('factory_id', fid, 'ambassador_code', code);
end $$;

create or replace function public.unprovision_test_accounts(p_users uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin')) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not public.test_accounts_enabled() then raise exception 'test accounts are disabled on this project'; end if;
  update public.factories set owner_id = null where owner_id = any(p_users);
  delete from public.factory_documents where note = 'وثيقة تجريبية';
  update public.ambassadors set status = 'suspended' where user_id = any(p_users);
  delete from public.user_roles where user_id = any(p_users) and role <> 'buyer';
end $$;

revoke execute on function public.test_accounts_enabled() from public, anon, authenticated;
revoke execute on function public.provision_test_accounts(uuid, uuid, uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.unprovision_test_accounts(uuid[]) from public, anon, authenticated;
grant execute on function public.test_accounts_enabled() to service_role;
grant execute on function public.provision_test_accounts(uuid, uuid, uuid, uuid, text) to service_role;
grant execute on function public.unprovision_test_accounts(uuid[]) to service_role;
