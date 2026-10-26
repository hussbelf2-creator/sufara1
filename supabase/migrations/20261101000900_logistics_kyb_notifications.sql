-- ════════════════════════════════════════════════════════════════════════
-- Safeer · 009 — warehouses (any number, any city), factory documents with
-- admin-managed document types, product images, shipments + tracking events
-- (shipping-aggregator ready), notifications, and group orders that miss
-- their minimum.
-- ════════════════════════════════════════════════════════════════════════

-- ── notifications (in-app; e-mail / WhatsApp dispatched by notify-dispatch) ─
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id),
  audience text not null default 'user' check (audience in ('user', 'admins')),
  email text,                                   -- for guests without an account
  kind text not null,
  title text not null,
  body text not null,
  link text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy notif_read on public.notifications for select
  using (user_id = auth.uid() or (audience = 'admins' and public.is_admin()));

create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text default null,
                                         p_data jsonb default '{}'::jsonb, p_email text default null) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, audience, email, kind, title, body, link, data)
  values (p_user, 'user', p_email, p_kind, p_title, p_body, p_link, coalesce(p_data, '{}'::jsonb));
$$;

create or replace function public.notify_admins(p_kind text, p_title text, p_body text, p_link text default null,
                                                p_data jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (audience, kind, title, body, link, data)
  values ('admins', p_kind, p_title, p_body, p_link, coalesce(p_data, '{}'::jsonb));
$$;
revoke execute on function public.notify(uuid, text, text, text, text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.notify_admins(text, text, text, text, jsonb) from public, anon, authenticated;

create or replace function public.mark_notifications_read(p_ids bigint[]) returns void
language sql security definer set search_path = public as $$
  update public.notifications set read_at = now()
  where id = any(p_ids) and read_at is null
    and (user_id = auth.uid() or (audience = 'admins' and public.is_admin()));
$$;

-- ── warehouses ─────────────────────────────────────────────────────────
create table if not exists public.warehouses (
  id text primary key check (id ~ '^[a-z0-9-]{2,30}$'),
  name_ar text not null, name_en text not null default '',
  country text not null default 'sa', city text not null, address text not null default '',
  contact_phone text, active boolean not null default true, is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists warehouses_one_default on public.warehouses (is_default) where is_default;
insert into public.warehouses (id, name_ar, name_en, city, address, is_default)
values ('jed-1', 'مستودع جدة — التجميع والفحص', 'Jeddah consolidation & inspection', 'جدة', 'المنطقة الصناعية', true)
on conflict (id) do nothing;
alter table public.warehouses enable row level security;
create policy wh_read on public.warehouses for select using (active or public.is_admin());
create policy wh_admin on public.warehouses for all using (public.is_admin()) with check (public.is_admin());

alter table public.factories add column if not exists default_warehouse_id text references public.warehouses (id);

alter table public.sub_orders add column if not exists warehouse_id text references public.warehouses (id);
alter table public.sub_orders add column if not exists handover_at timestamptz;
alter table public.sub_orders add column if not exists handover_ref text;
alter table public.sub_orders add column if not exists received_at timestamptz;
alter table public.sub_orders add column if not exists inspection text not null default 'pending'
  check (inspection in ('pending', 'passed', 'failed'));
alter table public.sub_orders add column if not exists inspection_note text;
alter table public.sub_orders add column if not exists inspected_at timestamptz;
alter table public.sub_orders add column if not exists shipment_id uuid;

-- A paid sub-order is routed to its factory's warehouse (or the default one)
-- and the factory is told where to hand it over.
create or replace function public.route_paid_sub_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare wh text; owner uuid;
begin
  if new.status = 'paid' and (old.status is distinct from 'paid') and new.warehouse_id is null then
    select coalesce(f.default_warehouse_id, (select id from public.warehouses where is_default and active limit 1)), f.owner_id
      into wh, owner from public.factories f where f.id = new.factory_id;
    new.warehouse_id := wh;
    if owner is not null then
      perform public.notify(owner, 'order.handover', 'طلب جديد للتجهيز', 'جهّز الطلب ' || new.id || ' وسلّمه إلى المستودع ' || coalesce(wh, ''),
                            '/dashboard?mode=factory&view=f-shipping', jsonb_build_object('sub_order', new.id, 'warehouse', wh));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists sub_orders_route on public.sub_orders;
create trigger sub_orders_route before update of status on public.sub_orders
  for each row execute function public.route_paid_sub_order();

create or replace function public.factory_handover(p_sub_order text, p_reference text) returns void
language plpgsql security definer set search_path = public as $$
declare s public.sub_orders;
begin
  select * into s from public.sub_orders where id = p_sub_order for update;
  if s.id is null or not public.owns_factory(s.factory_id) then raise exception 'forbidden'; end if;
  if s.status <> 'paid' then raise exception 'sub-order is not awaiting handover'; end if;
  update public.sub_orders set handover_at = now(), handover_ref = left(p_reference, 120) where id = s.id;
  perform public.notify_admins('warehouse.inbound', 'شحنة واردة إلى المستودع',
    'المصنع سلّم ' || s.id || ' إلى ' || coalesce(s.warehouse_id, '') || ' (مرجع: ' || coalesce(p_reference, '—') || ')',
    '/dashboard?mode=admin&view=admin-warehouses', jsonb_build_object('sub_order', s.id, 'warehouse', s.warehouse_id));
  perform public.audit('warehouse.handover', 'sub_orders', s.id, jsonb_build_object('ref', p_reference));
end $$;

create or replace function public.wh_receive(p_sub_order text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.sub_orders set received_at = now() where id = p_sub_order and status = 'paid' and received_at is null;
  if not found then raise exception 'cannot receive this sub-order'; end if;
  perform public.audit('warehouse.receive', 'sub_orders', p_sub_order, '{}'::jsonb);
end $$;

create or replace function public.wh_inspect(p_sub_order text, p_passed boolean, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare s public.sub_orders; owner uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into s from public.sub_orders where id = p_sub_order for update;
  if s.received_at is null then raise exception 'receive before inspecting'; end if;
  if not p_passed and coalesce(trim(p_note), '') = '' then raise exception 'a failed inspection needs a note'; end if;
  update public.sub_orders set inspection = case when p_passed then 'passed' else 'failed' end,
         inspection_note = p_note, inspected_at = now() where id = s.id;
  if not p_passed then
    select owner_id into owner from public.factories where id = s.factory_id;
    if owner is not null then
      perform public.notify(owner, 'warehouse.inspection_failed', 'لم يجتز الطلب الفحص',
        s.id || ': ' || p_note, '/dashboard?mode=factory&view=f-shipping', jsonb_build_object('sub_order', s.id));
    end if;
  end if;
  perform public.audit('warehouse.inspect', 'sub_orders', s.id, jsonb_build_object('passed', p_passed, 'note', p_note));
end $$;

-- ── carriers, shipments, events ───────────────────────────────────────────
create table if not exists public.carriers (
  code text primary key,
  name_ar text not null, name_en text not null,
  services text[] not null default '{express}',
  mode text not null default 'manual' check (mode in ('manual', 'aggregator')),
  tracking_url text,                            -- e.g. https://carrier/track?n={tracking}
  active boolean not null default true
);
insert into public.carriers (code, name_ar, name_en, services, tracking_url) values
  ('aramex', 'أرامكس', 'Aramex', '{express,economy,freight}', 'https://www.aramex.com/track/results?ShipmentNumber={tracking}'),
  ('dhl', 'دي إتش إل', 'DHL Express', '{express}', 'https://www.dhl.com/global-en/home/tracking.html?tracking-id={tracking}'),
  ('smsa', 'سمسا', 'SMSA Express', '{express,economy}', 'https://www.smsaexpress.com/trackingdetails?tracknumbers={tracking}'),
  ('spl', 'سبل', 'SPL (Saudi Post)', '{economy}', 'https://splonline.com.sa/en/shipmentdetails/?tid={tracking}'),
  ('freight', 'شحن مجمّع (بحري/جوي)', 'Consolidated freight', '{sea,air}', null)
on conflict (code) do nothing;
alter table public.carriers enable row level security;
create policy carriers_read on public.carriers for select using (true);
create policy carriers_admin on public.carriers for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  warehouse_id text not null references public.warehouses (id),
  carrier_code text not null references public.carriers (code),
  service text not null,
  kind text not null check (kind in ('retail', 'group', 'consolidated')),
  destination_country text not null,
  tracking_no text unique,
  label_url text,
  provider_ref text,
  cost numeric(12, 2),
  status text not null default 'draft'
    check (status in ('draft', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned', 'cancelled')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  dispatched_at timestamptz, delivered_at timestamptz
);
create table if not exists public.shipment_items (
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  sub_order_id text not null unique references public.sub_orders (id),
  primary key (shipment_id, sub_order_id)
);
create table if not exists public.shipment_events (
  id bigint generated always as identity primary key,
  shipment_id uuid not null references public.shipments (id),
  status text not null,
  description text,
  location text,
  occurred_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('carrier', 'manual')),
  raw jsonb,
  created_at timestamptz not null default now()
);
drop trigger if exists shipment_events_append_only on public.shipment_events;
create trigger shipment_events_append_only before update or delete on public.shipment_events
  for each row execute function public.forbid_mutation();
alter table public.sub_orders drop constraint if exists sub_orders_shipment_fk;
alter table public.sub_orders add constraint sub_orders_shipment_fk foreign key (shipment_id) references public.shipments (id);

alter table public.shipments enable row level security;
alter table public.shipment_items enable row level security;
alter table public.shipment_events enable row level security;

create or replace function public.can_see_shipment(p_shipment uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.shipment_items i
    join public.sub_orders s on s.id = i.sub_order_id
    join public.orders o on o.id = s.order_id
    where i.shipment_id = p_shipment and (o.buyer_user_id = auth.uid() or public.owns_factory(s.factory_id)));
$$;
create policy ship_read on public.shipments for select using (public.can_see_shipment(id));
create policy ship_items_read on public.shipment_items for select using (public.can_see_shipment(shipment_id));
create policy ship_events_read on public.shipment_events for select using (public.can_see_shipment(shipment_id));

-- Packs inspected sub-orders of one destination into one shipment.
create or replace function public.wh_create_shipment(p_warehouse text, p_subs text[], p_carrier text, p_service text) returns uuid
language plpgsql security definer set search_path = public as $$
declare sid uuid; dest text; n int; k text; ch text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if coalesce(array_length(p_subs, 1), 0) = 0 then raise exception 'nothing to pack'; end if;
  select count(*), min(o.country), count(distinct o.country) into n, dest, k
  from public.sub_orders s join public.orders o on o.id = s.order_id
  where s.id = any(p_subs) and s.warehouse_id = p_warehouse and s.inspection = 'passed' and s.shipment_id is null and s.status = 'paid';
  if n <> array_length(p_subs, 1) then raise exception 'every item must be received, inspected (passed) and not packed, in this warehouse'; end if;
  if k::int > 1 then raise exception 'one shipment per destination country'; end if;
  select case when bool_or(o.channel = 'wholesale') then 'consolidated'
              when bool_or(o.group_order_id is not null) then 'group' else 'retail' end into ch
  from public.sub_orders s join public.orders o on o.id = s.order_id where s.id = any(p_subs);
  if not exists (select 1 from public.carriers where code = p_carrier and active and p_service = any(services)) then
    raise exception 'carrier or service not available';
  end if;
  insert into public.shipments (warehouse_id, carrier_code, service, kind, destination_country, created_by)
  values (p_warehouse, p_carrier, p_service, ch, dest, auth.uid()) returning id into sid;
  insert into public.shipment_items (shipment_id, sub_order_id) select sid, unnest(p_subs);
  update public.sub_orders set shipment_id = sid where id = any(p_subs);
  perform public.audit('shipment.create', 'shipments', sid::text, jsonb_build_object('subs', p_subs, 'carrier', p_carrier));
  return sid;
end $$;

-- Label from the aggregator (or typed in manually by the warehouse).
create or replace function public.shipment_label(p_shipment uuid, p_tracking text, p_label_url text, p_provider_ref text, p_cost numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_server();
  if coalesce(trim(p_tracking), '') = '' then raise exception 'tracking number required'; end if;
  update public.shipments set tracking_no = p_tracking, label_url = p_label_url, provider_ref = p_provider_ref,
         cost = p_cost, status = 'label_created' where id = p_shipment and status = 'draft';
  if not found then raise exception 'shipment is not a draft'; end if;
  insert into public.shipment_events (shipment_id, status, description, source)
  values (p_shipment, 'label_created', 'Label created', case when auth.role() = 'service_role' then 'carrier' else 'manual' end);
end $$;

-- One tracking event: updates the shipment, and through record_shipment the
-- sub-orders (dispatch, delivery → return window → commissions).
create or replace function public.record_shipment_event(p_shipment uuid, p_status text, p_at timestamptz default now(),
                                                        p_description text default null, p_location text default null,
                                                        p_raw jsonb default null) returns void
language plpgsql security definer set search_path = public as $$
declare sh public.shipments; it record; src text := case when auth.role() = 'service_role' then 'carrier' else 'manual' end;
begin
  perform public.require_server();
  if p_status not in ('in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned') then raise exception 'bad status'; end if;
  select * into sh from public.shipments where id = p_shipment for update;
  if sh.id is null then raise exception 'unknown shipment'; end if;
  if sh.status in ('draft', 'cancelled') then raise exception 'create the label first'; end if;
  insert into public.shipment_events (shipment_id, status, description, location, occurred_at, source, raw)
  values (sh.id, p_status, p_description, p_location, p_at, src, p_raw);

  if p_status in ('in_transit', 'out_for_delivery') and sh.dispatched_at is null then
    update public.shipments set dispatched_at = p_at where id = sh.id;
    for it in select sub_order_id from public.shipment_items where shipment_id = sh.id loop
      perform public.record_shipment(it.sub_order_id, 'dispatched', p_at, sh.tracking_no);
    end loop;
  end if;
  if p_status = 'delivered' and sh.delivered_at is null then
    if sh.dispatched_at is null then
      for it in select sub_order_id from public.shipment_items where shipment_id = sh.id loop
        perform public.record_shipment(it.sub_order_id, 'dispatched', p_at, sh.tracking_no);
      end loop;
    end if;
    update public.shipments set delivered_at = p_at, dispatched_at = coalesce(dispatched_at, p_at) where id = sh.id;
    for it in select sub_order_id from public.shipment_items where shipment_id = sh.id loop
      perform public.record_shipment(it.sub_order_id, 'delivered', p_at);
    end loop;
  end if;
  if p_status = 'returned' then
    for it in select sub_order_id from public.shipment_items where shipment_id = sh.id loop
      perform public.record_shipment(it.sub_order_id, 'returned', p_at);
    end loop;
  end if;
  if p_status = 'exception' then
    perform public.notify_admins('shipment.exception', 'تعثّر في شحنة', coalesce(sh.tracking_no, sh.id::text) || ': ' || coalesce(p_description, ''),
                                 '/dashboard?mode=admin&view=admin-logistics', jsonb_build_object('shipment', sh.id));
  end if;
  update public.shipments set status = p_status where id = sh.id;
end $$;

-- ── factory documents (KYB), types managed by the admin ──────────────────
create table if not exists public.document_types (
  code text primary key check (code ~ '^[a-z0-9_]{2,40}$'),
  name_ar text not null, name_en text not null,
  description text,
  required boolean not null default false,
  needs_expiry boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0
);
insert into public.document_types (code, name_ar, name_en, required, needs_expiry, sort_order) values
  ('cr', 'السجل التجاري', 'Commercial registration', true, true, 1),
  ('industrial_license', 'الترخيص الصناعي', 'Industrial licence', true, true, 2),
  ('halal', 'شهادة الحلال', 'Halal certificate', true, true, 3),
  ('sfda', 'تسجيل هيئة الغذاء والدواء', 'SFDA registration', false, true, 4),
  ('saudi_made', 'شعار صنع في السعودية', 'Saudi Made licence', false, true, 5),
  ('iso', 'شهادة ISO', 'ISO certificate', false, true, 6)
on conflict (code) do nothing;
alter table public.document_types enable row level security;
create policy doctypes_read on public.document_types for select using (true);
create policy doctypes_admin on public.document_types for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.factory_documents (
  id bigint generated always as identity primary key,
  factory_id text not null references public.factories (id),
  type_code text not null references public.document_types (code),
  storage_path text not null,
  file_name text not null,
  expires_on date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text,
  uploaded_by uuid references auth.users (id),
  uploaded_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz
);
alter table public.factory_documents enable row level security;
create policy fdoc_read on public.factory_documents for select using (public.owns_factory(factory_id) or public.is_admin());
create policy fdoc_insert on public.factory_documents for insert
  with check (public.owns_factory(factory_id) and status = 'pending' and uploaded_by = auth.uid()
              and storage_path like factory_id || '/%');

create or replace function public.factory_document_uploaded() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_admins('kyb.uploaded', 'وثيقة مصنع بانتظار المراجعة',
    new.factory_id || ' · ' || new.type_code, '/dashboard?mode=admin&view=admin-compliance',
    jsonb_build_object('document', new.id, 'factory', new.factory_id));
  return new;
end $$;
drop trigger if exists factory_documents_notify on public.factory_documents;
create trigger factory_documents_notify after insert on public.factory_documents
  for each row execute function public.factory_document_uploaded();

-- KYB = every active required type has an approved, unexpired latest document.
create or replace function public.kyb_missing(p_factory text) returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(t.code order by t.sort_order), '{}')
  from public.document_types t
  where t.active and t.required and not exists (
    select 1 from public.factory_documents d
    where d.factory_id = p_factory and d.type_code = t.code and d.status = 'approved'
      and (d.expires_on is null or d.expires_on >= current_date));
$$;

create or replace function public.recompute_factory_kyb(p_factory text) returns text
language plpgsql security definer set search_path = public as $$
declare missing text[] := public.kyb_missing(p_factory); next_state verification_state; owner uuid;
begin
  if (select kyb_status from public.factories where id = p_factory) = 'rejected' then return 'rejected'; end if;
  next_state := case when cardinality(missing) = 0 then 'verified' else 'pending' end;
  update public.factories set kyb_status = next_state where id = p_factory and kyb_status is distinct from next_state
    returning owner_id into owner;
  if found and next_state = 'verified' and owner is not null then
    perform public.notify(owner, 'kyb.verified', 'تم توثيق المصنع', 'اكتملت الوثائق المطلوبة ويمكن نشر منتجاتك بعد مراجعتها.',
                          '/dashboard?mode=factory&view=f-products');
  end if;
  return next_state::text;
end $$;

create or replace function public.admin_review_document(p_id bigint, p_decision text, p_note text default null) returns text
language plpgsql security definer set search_path = public as $$
declare d public.factory_documents; owner uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'bad decision'; end if;
  if p_decision = 'rejected' and coalesce(trim(p_note), '') = '' then raise exception 'a rejection needs a reason'; end if;
  update public.factory_documents set status = p_decision, note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_id returning * into d;
  if d.id is null then raise exception 'unknown document'; end if;
  select owner_id into owner from public.factories where id = d.factory_id;
  if owner is not null then
    perform public.notify(owner, 'kyb.' || p_decision,
      case when p_decision = 'approved' then 'قُبلت وثيقة' else 'رُفضت وثيقة' end,
      d.type_code || coalesce(' — ' || p_note, ''), '/dashboard?mode=factory&view=f-join', jsonb_build_object('document', d.id));
  end if;
  perform public.audit('kyb.' || p_decision, 'factory_documents', p_id::text, jsonb_build_object('factory', d.factory_id, 'type', d.type_code, 'note', p_note));
  return public.recompute_factory_kyb(d.factory_id);
end $$;

-- Approval of a factory account now creates the factory as "pending" KYB:
-- it becomes "verified" only when its required documents are approved.
create or replace function public.admin_set_verification(p_user_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles; base text; tag text; fid text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('verified', 'rejected', 'pending') then raise exception 'bad status'; end if;
  update public.profiles set verification_status = p_status::verification_state where id = p_user_id returning * into p;
  if p.id is null then raise exception 'unknown user'; end if;

  if p_status = 'verified' and p.requested_panel in ('ambassador', 'factory') then
    insert into public.user_roles (user_id, role, granted_by) values (p_user_id, p.requested_panel, auth.uid()) on conflict do nothing;
    if p.requested_panel = 'ambassador' then
      base := coalesce(nullif(lower(regexp_replace(split_part(p.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')), ''), 'amb');
      tag := substr(encode(gen_random_bytes(3), 'hex'), 1, 4);
      insert into public.ambassadors (user_id, slug, code, leader_id, acquisition_channel)
      values (p_user_id, left(base, 20) || '-' || tag, upper(left(base, 8)) || '-' || upper(tag),
              (select a.user_id from public.ambassadors a where a.user_id = p.leader_id and a.is_leader),
              coalesce(p.acquisition_channel, 'pilgrims'))
      on conflict (user_id) do update set status = 'active';
    else
      select id into fid from public.factories where owner_id = p_user_id limit 1;
      if fid is null then
        fid := left(public.slugify(coalesce(nullif(p.company, ''), split_part(p.email, '@', 1))), 30);
        if exists (select 1 from public.factories where id = fid) then
          fid := fid || '-' || substr(encode(gen_random_bytes(2), 'hex'), 1, 4);
        end if;
        insert into public.factories (id, owner_id, name_ar, name_en, city, cr_number, vat_number, kyb_status, default_warehouse_id)
        values (fid, p_user_id, coalesce(nullif(p.company, ''), p.full_name), coalesce(nullif(p.company, ''), p.full_name),
                coalesce(p.city, ''), p.cr_number, p.vat_number, 'pending',
                (select id from public.warehouses where is_default and active limit 1));
      else
        update public.factories set kyb_status = 'pending' where id = fid and kyb_status = 'rejected';
      end if;
      perform public.recompute_factory_kyb(fid);
      perform public.notify(p_user_id, 'kyb.required', 'ارفع وثائق المصنع',
        'اعتُمد حسابك. ارفع الوثائق المطلوبة لتوثيق المصنع ونشر المنتجات.', '/dashboard?mode=factory&view=f-join');
    end if;
  elsif p_status = 'rejected' then
    delete from public.user_roles where user_id = p_user_id and role in ('ambassador', 'factory');
    update public.ambassadors set status = 'suspended' where user_id = p_user_id;
    update public.factories set kyb_status = 'rejected' where owner_id = p_user_id;
  end if;

  update public.kyc_private set reviewed_by = auth.uid(), reviewed_at = now() where user_id = p_user_id;
  perform public.audit('account.verification', 'profiles', p_user_id::text,
                       jsonb_build_object('status', p_status, 'role', p.requested_panel, 'factory', fid));
end $$;

-- ── product images ─────────────────────────────────────────────────────
alter table public.products add column if not exists images text[] not null default '{}';

-- ── storage buckets ────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('kyb', 'kyb', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.owns_storage_folder(p_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.owns_factory(split_part(p_name, '/', 1));
$$;

drop policy if exists kyb_owner_write on storage.objects;
drop policy if exists kyb_read on storage.objects;
drop policy if exists pimg_read on storage.objects;
drop policy if exists pimg_owner_write on storage.objects;
drop policy if exists pimg_owner_delete on storage.objects;
create policy kyb_owner_write on storage.objects for insert with check (bucket_id = 'kyb' and public.owns_storage_folder(name));
create policy kyb_read on storage.objects for select using (bucket_id = 'kyb' and (public.owns_storage_folder(name) or public.is_admin()));
create policy pimg_read on storage.objects for select using (bucket_id = 'product-images');
create policy pimg_owner_write on storage.objects for insert with check (bucket_id = 'product-images' and (public.owns_storage_folder(name) or public.is_admin()));
create policy pimg_owner_delete on storage.objects for delete using (bucket_id = 'product-images' and (public.owns_storage_folder(name) or public.is_admin()));

-- ── group orders that miss their minimum ─────────────────────────────────
alter table public.group_orders drop constraint if exists group_orders_status_check;
alter table public.group_orders add constraint group_orders_status_check
  check (status in ('open', 'awaiting_decision', 'ready', 'shipping', 'closed', 'cancelled'));
alter table public.group_orders add column if not exists decision text;
alter table public.group_orders add column if not exists decided_at timestamptz;

create table if not exists public.group_messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.group_orders (id),
  title text not null, body text not null,
  recipients int not null,
  sent_by uuid references auth.users (id),
  sent_at timestamptz not null default now()
);
alter table public.group_messages enable row level security;
create policy gm_admin on public.group_messages for select using (public.is_admin());

-- Nightly: a group past its deadline either becomes "ready" or waits for an admin decision.
create or replace function public.expire_group_orders() returns int
language plpgsql security definer set search_path = public as $$
declare g record; n int := 0;
begin
  perform public.require_server();
  for g in select * from public.group_orders where status = 'open' and closes_at <= now() for update loop
    if g.participants >= g.min_participants then
      update public.group_orders set status = 'ready' where id = g.id;
    else
      update public.group_orders set status = 'awaiting_decision' where id = g.id;
      perform public.notify_admins('group.short', 'طلب جماعي لم يكتمل',
        g.code || ': ' || g.participants || ' من ' || g.min_participants || ' مشاركين حتى انتهاء الموعد',
        '/dashboard?mode=admin&view=admin-groups', jsonb_build_object('group', g.id, 'code', g.code));
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

-- Admin → every buyer of the group (in-app for accounts, e-mail for guests).
create or replace function public.admin_group_message(p_group uuid, p_title text, p_body text) returns int
language plpgsql security definer set search_path = public as $$
declare o record; n int := 0;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_body), '') = '' then raise exception 'title and message required'; end if;
  for o in select distinct on (coalesce(buyer_user_id::text, buyer_email)) buyer_user_id, buyer_email, id
           from public.orders where group_order_id = p_group loop
    perform public.notify(o.buyer_user_id, 'group.message', p_title, p_body, '/dashboard?mode=buyer&view=messages',
                          jsonb_build_object('group', p_group, 'order', o.id),
                          case when o.buyer_user_id is null then o.buyer_email end);
    n := n + 1;
  end loop;
  insert into public.group_messages (group_id, title, body, recipients, sent_by) values (p_group, p_title, p_body, n, auth.uid());
  perform public.audit('group.message', 'group_orders', p_group::text, jsonb_build_object('recipients', n, 'title', p_title));
  return n;
end $$;

-- The decision, announced to the buyers with the admin's own message.
create or replace function public.admin_resolve_group(p_group uuid, p_action text, p_days int, p_title text, p_body text) returns int
language plpgsql security definer set search_path = public as $$
declare g public.group_orders; o record;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into g from public.group_orders where id = p_group for update;
  if g.id is null then raise exception 'unknown group'; end if;
  if g.status not in ('open', 'awaiting_decision') then raise exception 'group already decided'; end if;
  if p_action = 'extend' then
    if coalesce(p_days, 0) < 1 or p_days > 30 then raise exception 'extension must be 1–30 days'; end if;
    update public.group_orders set status = 'open', closes_at = now() + make_interval(days => p_days),
           decision = 'extend', decided_at = now() where id = g.id;
  elsif p_action = 'ship_anyway' then
    -- the platform absorbs the unshared part of the handling fee
    update public.group_orders set status = 'ready', decision = 'ship_anyway', decided_at = now() where id = g.id;
  elsif p_action = 'cancel' then
    for o in select id, status from public.orders where group_order_id = g.id loop
      if o.status in ('paid', 'dispatched') then
        perform public.refund_order(o.id);
      elsif o.status = 'pending_payment' then
        update public.orders set status = 'cancelled' where id = o.id;
      end if;
    end loop;
    update public.group_orders set status = 'cancelled', decision = 'cancel', decided_at = now() where id = g.id;
  else
    raise exception 'unknown action';
  end if;
  perform public.audit('group.' || p_action, 'group_orders', g.id::text, jsonb_build_object('days', p_days));
  return public.admin_group_message(g.id, p_title, p_body);
end $$;

-- the engine also closes groups
create or replace function public.run_nightly() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  perform public.require_server();
  r := public.run_commission_engine();
  return r || jsonb_build_object('groups_awaiting_decision', public.expire_group_orders());
end $$;

-- ── admin read models ───────────────────────────────────────────────────
create or replace view public.admin_warehouse_queue with (security_barrier = true) as
  select s.id, s.order_id, s.factory_id, s.warehouse_id, s.goods, s.handover_at, s.handover_ref, s.received_at,
         s.inspection, s.inspection_note, s.inspected_at, s.shipment_id, o.country, o.channel, o.ship_method,
         o.group_order_id, f.name_ar as factory_name,
         (select coalesce(sum(i.qty), 0) from public.order_items i where i.sub_order_id = s.id) as units
  from public.sub_orders s join public.orders o on o.id = s.order_id join public.factories f on f.id = s.factory_id
  where s.status = 'paid' and public.is_admin();

create or replace view public.admin_groups with (security_barrier = true) as
  select g.id, g.code, g.country, g.city, g.participants, g.min_participants, g.closes_at, g.status, g.decision, g.created_at,
         (select a.code from public.ambassadors a where a.user_id = g.organiser_ambassador_id) as organiser,
         (select count(*) from public.orders o where o.group_order_id = g.id and o.paid_at is not null) as paid_orders,
         (select coalesce(sum(o.total), 0) from public.orders o where o.group_order_id = g.id and o.paid_at is not null) as paid_total,
         (select count(*) from public.group_messages m where m.group_id = g.id) as messages
  from public.group_orders g where public.is_admin();

grant select on public.admin_warehouse_queue, public.admin_groups to authenticated;
grant execute on function public.mark_notifications_read(bigint[]) to authenticated;
grant execute on function public.factory_handover(text, text) to authenticated;
grant execute on function public.wh_receive(text) to authenticated;
grant execute on function public.wh_inspect(text, boolean, text) to authenticated;
grant execute on function public.wh_create_shipment(text, text[], text, text) to authenticated;
grant execute on function public.shipment_label(uuid, text, text, text, numeric) to authenticated, service_role;
grant execute on function public.record_shipment_event(uuid, text, timestamptz, text, text, jsonb) to authenticated, service_role;
grant execute on function public.kyb_missing(text) to authenticated;
grant execute on function public.admin_review_document(bigint, text, text) to authenticated;
grant execute on function public.expire_group_orders() to authenticated, service_role;
grant execute on function public.admin_group_message(uuid, text, text) to authenticated;
grant execute on function public.admin_resolve_group(uuid, text, int, text, text) to authenticated;
grant execute on function public.run_nightly() to authenticated, service_role;
