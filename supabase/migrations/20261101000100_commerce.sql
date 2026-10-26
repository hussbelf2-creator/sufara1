-- ════════════════════════════════════════════════════════════════════════
-- Safeer · 002 — catalogue, attribution, orders, commissions, ledger,
-- invoices, wholesale RFQ → quotes → deal, group orders (Decision Log §§5–9)
--
-- Money moves only through security-definer functions called by Edge
-- Functions (service role) or by admins. Clients read their own rows.
-- ════════════════════════════════════════════════════════════════════════

-- ── catalogue ────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id text primary key,
  name_ar text not null, name_en text not null,
  icon text not null default 'ri-box-3-line',
  sort_order int not null default 0
);

create table if not exists public.factories (
  id text primary key,
  owner_id uuid references auth.users (id),
  name_ar text not null, name_en text not null default '',
  city text not null default '',
  cr_number text, vat_number text,
  kyb_status verification_state not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  factory_id text not null references public.factories (id),
  category_id text not null references public.categories (id),
  name_ar text not null, name_en text not null default '',
  price numeric(12, 2) not null check (price > 0),        -- retail unit price, SAR
  weight_kg numeric(8, 3) not null default 0.5,
  hs_code text,
  stock int not null default 0,
  moq int,                                               -- wholesale minimum
  tiers jsonb not null default '[]'::jsonb,              -- [{min,max,price}]
  active boolean not null default false,                 -- published after admin review
  created_at timestamptz not null default now()
);
create index if not exists products_factory_idx on public.products (factory_id);

-- ── customers & the factory customer registry ───────────────────────────
-- A buyer is "new" to a factory only if they are not in its registry. The
-- factory can upload its existing customers so an ambassador can never
-- claim them (audit §3-ج).
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id),
  email_hash text not null unique,                       -- sha256(lower(email))
  phone_hash text,
  country text,
  created_at timestamptz not null default now()
);

create table if not exists public.factory_customers (
  factory_id text not null references public.factories (id),
  email_hash text not null,
  phone_hash text,
  source text not null default 'order' check (source in ('order', 'factory_upload')),
  first_order_at timestamptz,
  primary key (factory_id, email_hash)
);

-- ── ambassadors, leaders, referral links, clicks ────────────────────────
create table if not exists public.ambassadors (
  user_id uuid primary key references auth.users (id),
  slug text unique not null,
  code text unique not null,
  tier text not null default 'starter',
  leader_id uuid references public.ambassadors (user_id),   -- one level only
  is_leader boolean not null default false,
  acquisition_channel text not null default 'pilgrims',
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  check (leader_id is null or leader_id <> user_id)
);

-- One level only: a leader's member cannot itself be a leader of someone
-- who is attached to it — and a member's leader may not have a leader.
create or replace function public.guard_team_depth() returns trigger
language plpgsql as $$
begin
  if new.leader_id is not null and exists (
    select 1 from public.ambassadors where user_id = new.leader_id and leader_id is not null
  ) then
    raise exception 'team depth is limited to one level';
  end if;
  return new;
end $$;
drop trigger if exists ambassadors_depth on public.ambassadors;
create trigger ambassadors_depth before insert or update of leader_id on public.ambassadors
  for each row execute function public.guard_team_depth();

create table if not exists public.referral_links (
  code text primary key check (code = upper(code)),
  ambassador_id uuid not null references public.ambassadors (user_id),
  factory_id text references public.factories (id),
  discount_pct numeric(5, 2) not null default 4 check (discount_pct between 0 and 10),
  batch_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clicks (
  id uuid primary key default gen_random_uuid(),
  code text references public.referral_links (code),
  ambassador_id uuid not null references public.ambassadors (user_id),
  factory_id text,
  ip_hash text not null,
  ua_hash text not null,
  referrer text,
  created_at timestamptz not null default now()
);
create index if not exists clicks_amb_idx on public.clicks (ambassador_id, created_at desc);
create index if not exists clicks_ip_idx on public.clicks (ip_hash, created_at desc);

-- ── promo codes (platform-funded, exact match only) ─────────────────────
create table if not exists public.promo_codes (
  code text primary key check (code = upper(code)),
  kind text not null check (kind in ('percent', 'fixed')),
  value numeric(10, 2) not null check (value >= 0),
  min_subtotal numeric(12, 2) not null default 0,
  starts_at timestamptz, ends_at timestamptz,
  max_uses int, used int not null default 0,
  active boolean not null default true
);

-- ── orders ───────────────────────────────────────────────────────────────
do $$ begin
  create type order_status as enum ('pending_payment', 'paid', 'dispatched', 'delivered', 'closed', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id text primary key,                                  -- SFR-YYMM-XXXXXX
  customer_id uuid not null references public.customers (id),
  buyer_user_id uuid references auth.users (id),
  -- contact needed to deliver and to send the invoice; readable by the buyer and admins only
  buyer_name text not null default '', buyer_email text not null default '', buyer_phone text,
  buyer_company text, buyer_vat_no text,
  channel text not null check (channel in ('retail', 'wholesale')),
  status order_status not null default 'pending_payment',
  country text not null, city text, port text, address text,
  incoterm text not null check (incoterm in ('DDP', 'CIF', 'FOB')),
  customs_party text not null check (customs_party in ('platform', 'buyer', 'agent')),
  ship_method text not null check (ship_method in ('express', 'group', 'sea', 'air')),
  group_order_id uuid,
  goods numeric(12, 2) not null,                        -- after tier pricing, before discount
  discount numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  customs numeric(12, 2) not null default 0,
  vat numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,                        -- charged, SAR
  display_currency text not null default 'SAR',
  promo_code text,
  referral_code text,
  click_id uuid references public.clicks (id),
  ambassador_id uuid references public.ambassadors (user_id),
  settings_version int not null,                        -- the PlatformConfig version that priced it
  return_days int not null,
  invoice_no text unique,
  payment_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz, delivered_at timestamptz
);
create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);

-- One sub-order per factory: settlement, shipping and commission are per factory.
create table if not exists public.sub_orders (
  id text primary key,                                  -- <order>-<n>
  order_id text not null references public.orders (id),
  factory_id text not null references public.factories (id),
  goods numeric(12, 2) not null,
  discount numeric(12, 2) not null default 0,
  take_rate numeric(6, 4) not null,
  take numeric(12, 2) not null,
  new_customer boolean not null,
  status order_status not null default 'pending_payment',
  tracking_no text,
  dispatched_at timestamptz, delivered_at timestamptz, returned boolean not null default false,
  settled boolean not null default false          -- escrow released to factory + platform
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  sub_order_id text not null references public.sub_orders (id),
  product_id text not null references public.products (id),
  qty int not null check (qty > 0),
  unit_price numeric(12, 2) not null,
  line_total numeric(12, 2) not null
);

-- ── commissions ─────────────────────────────────────────────────────────
do $$ begin
  create type commission_state as enum ('pending', 'eligible', 'paid', 'void');
exception when duplicate_object then null; end $$;

create table if not exists public.commissions (
  id bigint generated always as identity primary key,
  sub_order_id text not null references public.sub_orders (id),
  beneficiary_id uuid not null references public.ambassadors (user_id),
  kind text not null check (kind in ('ambassador', 'leader')),
  rate numeric(6, 4) not null,
  base numeric(12, 2) not null,
  amount numeric(12, 2) not null,
  state commission_state not null default 'pending',
  unlock_at timestamptz,                                -- delivered_at + destination return window
  payout_id bigint,
  created_at timestamptz not null default now(),
  unique (sub_order_id, kind)
);

create table if not exists public.payouts (
  id bigint generated always as identity primary key,
  beneficiary_id uuid not null references public.ambassadors (user_id),
  amount numeric(12, 2) not null,
  method text not null,
  status text not null default 'requested' check (status in ('requested', 'approved', 'sent', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_by uuid references auth.users (id), decided_at timestamptz
);

-- ── double-entry, append-only ledger ────────────────────────────────────
create table if not exists public.ledger_entries (
  id bigint generated always as identity primary key,
  txn_id uuid not null,
  account text not null,
  debit numeric(14, 2) not null default 0 check (debit >= 0),
  credit numeric(14, 2) not null default 0 check (credit >= 0),
  order_id text references public.orders (id),
  sub_order_id text references public.sub_orders (id),
  memo text not null,
  created_at timestamptz not null default now(),
  check ((debit = 0) <> (credit = 0))
);
create index if not exists ledger_txn_idx on public.ledger_entries (txn_id);
create index if not exists ledger_time_idx on public.ledger_entries (created_at);

drop trigger if exists ledger_append_only on public.ledger_entries;
create trigger ledger_append_only before update or delete on public.ledger_entries
  for each row execute function public.forbid_mutation();

-- Posts one balanced transaction: p_lines = [{account, debit|credit, sub_order_id?}]
create or replace function public.post_txn(p_memo text, p_order text, p_lines jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  t uuid := gen_random_uuid();
  dr numeric := 0; cr numeric := 0; l jsonb;
begin
  for l in select * from jsonb_array_elements(p_lines) loop
    dr := dr + coalesce((l ->> 'debit')::numeric, 0);
    cr := cr + coalesce((l ->> 'credit')::numeric, 0);
  end loop;
  if round(dr, 2) <> round(cr, 2) then raise exception 'unbalanced transaction: % vs %', dr, cr; end if;
  insert into public.ledger_entries (txn_id, account, debit, credit, order_id, sub_order_id, memo)
  select t, x.line ->> 'account', coalesce((x.line ->> 'debit')::numeric, 0), coalesce((x.line ->> 'credit')::numeric, 0),
         p_order, x.line ->> 'sub_order_id', p_memo
  from jsonb_array_elements(p_lines) as x(line)
  where coalesce((x.line ->> 'debit')::numeric, 0) > 0 or coalesce((x.line ->> 'credit')::numeric, 0) > 0;
  return t;
end $$;
revoke execute on function public.post_txn(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.post_txn(text, text, jsonb) to service_role;

-- ── month close: hash-chained, server-computed ──────────────────────────
create table if not exists public.ledger_closes (
  id uuid primary key default gen_random_uuid(),
  period_from date not null, period_to date not null,
  totals jsonb not null,
  entry_count int not null,
  previous_hash text not null,
  hash text not null unique,
  closed_by uuid references auth.users (id),
  closed_at timestamptz not null default now()
);
drop trigger if exists ledger_closes_append_only on public.ledger_closes;
create trigger ledger_closes_append_only before update or delete on public.ledger_closes
  for each row execute function public.forbid_mutation();

create or replace function public.close_ledger_period(p_from date, p_to date) returns public.ledger_closes
language plpgsql security definer set search_path = public as $$
declare
  prev text := coalesce((select hash from public.ledger_closes order by closed_at desc limit 1), repeat('0', 64));
  tot jsonb; n int; ids text; r public.ledger_closes;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select coalesce(jsonb_object_agg(account, bal), '{}'::jsonb), coalesce(sum(cnt), 0)::int
    into tot, n
  from (
    select account, sum(debit - credit) as bal, count(*) as cnt
    from public.ledger_entries
    where created_at >= p_from and created_at < p_to + 1
    group by account
  ) a;
  select coalesce(string_agg(id::text, ',' order by id), '') into ids
  from public.ledger_entries where created_at >= p_from and created_at < p_to + 1;
  insert into public.ledger_closes (period_from, period_to, totals, entry_count, previous_hash, hash, closed_by)
  values (p_from, p_to, tot, n, prev,
          encode(digest(prev || '|' || p_from || '|' || p_to || '|' || tot::text || '|' || ids, 'sha256'), 'hex'),
          auth.uid())
  returning * into r;
  perform public.audit('ledger.close', 'ledger_closes', r.id::text, jsonb_build_object('from', p_from, 'to', p_to, 'hash', r.hash));
  return r;
end $$;

-- ── tax invoices: gap-free counter + hash chain (ZATCA ICV / PIH) ───────
create table if not exists public.invoice_counters (
  year int primary key,
  last_value int not null default 0
);

create table if not exists public.invoices (
  invoice_no text primary key,
  icv int not null unique,                              -- invoice counter value, never reset
  order_id text not null unique references public.orders (id),
  issued_at timestamptz not null default now(),
  payload jsonb not null,
  previous_hash text not null,
  hash text not null unique
);
drop trigger if exists invoices_append_only on public.invoices;
create trigger invoices_append_only before update or delete on public.invoices
  for each row execute function public.forbid_mutation();

create or replace function public.issue_invoice(p_order_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o public.orders; yr int := extract(year from now())::int; nxt int; icv_ int;
  prev text; body jsonb; no text; h text; existing public.invoices;
begin
  select * into o from public.orders where id = p_order_id;
  if o.id is null then raise exception 'unknown order'; end if;
  if not (public.is_admin() or auth.role() = 'service_role' or o.buyer_user_id = auth.uid()) then
    raise exception 'forbidden';
  end if;
  select * into existing from public.invoices where order_id = p_order_id;
  if existing.invoice_no is not null then
    return jsonb_build_object('invoice_no', existing.invoice_no, 'icv', existing.icv, 'hash', existing.hash, 'previous_hash', existing.previous_hash);
  end if;
  if o.status not in ('paid', 'dispatched', 'delivered', 'closed') then raise exception 'order not paid'; end if;

  -- Serialise issuance: one row lock, no gaps, no duplicates.
  insert into public.invoice_counters (year, last_value) values (yr, 0) on conflict do nothing;
  update public.invoice_counters set last_value = last_value + 1 where year = yr returning last_value into nxt;
  select coalesce(max(icv), 0) + 1 into icv_ from public.invoices;
  prev := coalesce((select hash from public.invoices order by icv desc limit 1),
                   encode(digest('0', 'sha256'), 'hex'));   -- first invoice PIH per ZATCA spec
  no := 'INV-' || yr || '-' || lpad(nxt::text, 7, '0');
  body := jsonb_build_object(
    'invoice_no', no, 'icv', icv_, 'order_id', o.id, 'issued_at', now(),
    'seller_vat', (public.active_settings() -> 'tax' ->> 'sellerVatNo'),
    'goods', o.goods, 'discount', o.discount, 'shipping', o.shipping, 'customs', o.customs,
    'vat', o.vat, 'total', o.total, 'country', o.country, 'zero_rated', o.vat = 0
  );
  h := encode(digest(body::text || '|' || prev, 'sha256'), 'hex');
  insert into public.invoices (invoice_no, icv, order_id, payload, previous_hash, hash)
  values (no, icv_, o.id, body, prev, h);
  update public.orders set invoice_no = no where id = o.id;
  return jsonb_build_object('invoice_no', no, 'icv', icv_, 'hash', h, 'previous_hash', prev);
end $$;

-- ── referral helpers ────────────────────────────────────────────────────
create or replace function public.resolve_referral(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', r.code, 'slug', a.slug, 'factory_id', r.factory_id,
                            'discount', least(r.discount_pct, coalesce((public.active_settings() -> 'promo' ->> 'ambassadorCodeRate')::numeric * 100, 4)))
  from public.referral_links r join public.ambassadors a on a.user_id = r.ambassador_id
  where r.code = upper(trim(p_code)) and r.active and a.status = 'active';
$$;

-- A leader prints one card per pilgrim; each card is a registered code owned
-- by the leader until the pilgrim signs up and claims it.
create or replace function public.create_qr_batch(p_group text, p_count int) returns table (code text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare
  me public.ambassadors; prefix text; i int;
begin
  select * into me from public.ambassadors where user_id = auth.uid();
  if me.user_id is null or not me.is_leader then raise exception 'leaders only'; end if;
  if p_count < 1 or p_count > 200 then raise exception 'count out of range'; end if;
  prefix := split_part(me.code, '-', 1) || '-' || upper(regexp_replace(p_group, '[^A-Za-z0-9]', '', 'g'));
  for i in 1..p_count loop
    code := prefix || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    insert into public.referral_links (code, ambassador_id, batch_id, discount_pct)
    values (code, me.user_id, p_group, coalesce((public.active_settings() -> 'promo' ->> 'ambassadorCodeRate')::numeric * 100, 4));
    return next;
  end loop;
  perform public.audit('referral.batch', 'referral_links', p_group, jsonb_build_object('count', p_count));
end $$;

-- ── wholesale: RFQ → quotes → comparison → deal with instalments ────────
create table if not exists public.rfqs (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references auth.users (id),
  product_id text references public.products (id),
  category_id text references public.categories (id),
  qty int not null check (qty > 0),
  country text not null, port text, incoterm text not null default 'CIF',
  notes text,
  ambassador_id uuid references public.ambassadors (user_id),
  status text not null default 'open' check (status in ('open', 'quoted', 'awarded', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs (id),
  factory_id text not null references public.factories (id),
  unit_price numeric(12, 2) not null,
  lead_days int not null,
  terms text not null default '',
  valid_until date not null,
  status text not null default 'submitted' check (status in ('submitted', 'accepted', 'rejected', 'expired')),
  created_at timestamptz not null default now(),
  unique (rfq_id, factory_id)
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references public.quotes (id),
  order_id text references public.orders (id),
  total numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.deal_installments (
  id bigint generated always as identity primary key,
  deal_id uuid not null references public.deals (id),
  seq int not null,
  due_on date not null,
  share numeric(5, 4) not null check (share > 0 and share <= 1),
  amount numeric(14, 2) not null,
  status text not null default 'due' check (status in ('due', 'paid', 'late')),
  paid_at timestamptz,
  unique (deal_id, seq)
);

-- ── group orders (pilgrims' consolidated retail parcels) ───────────────
create table if not exists public.group_orders (
  id uuid primary key default gen_random_uuid(),
  organiser_ambassador_id uuid references public.ambassadors (user_id),
  country text not null, city text,
  min_participants int not null default 5,
  closes_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'shipping', 'closed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.categories enable row level security;
alter table public.factories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.factory_customers enable row level security;
alter table public.ambassadors enable row level security;
alter table public.referral_links enable row level security;
alter table public.clicks enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders enable row level security;
alter table public.sub_orders enable row level security;
alter table public.order_items enable row level security;
alter table public.commissions enable row level security;
alter table public.payouts enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.ledger_closes enable row level security;
alter table public.invoice_counters enable row level security;
alter table public.invoices enable row level security;
alter table public.rfqs enable row level security;
alter table public.quotes enable row level security;
alter table public.deals enable row level security;
alter table public.deal_installments enable row level security;
alter table public.group_orders enable row level security;

create or replace function public.owns_factory(p_factory text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.factories where id = p_factory and owner_id = auth.uid());
$$;

-- catalogue: public reads active products; factory owners manage drafts; admins publish
create policy cat_read on public.categories for select using (true);
create policy cat_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy fac_read on public.factories for select using (kyb_status = 'verified' or owner_id = auth.uid() or public.is_admin());
create policy fac_admin on public.factories for all using (public.is_admin()) with check (public.is_admin());
create policy prod_read on public.products for select using (active or public.owns_factory(factory_id) or public.is_admin());
create policy prod_owner_insert on public.products for insert with check (public.owns_factory(factory_id) and active = false);
create policy prod_owner_update on public.products for update using (public.owns_factory(factory_id) or public.is_admin())
  with check ((public.owns_factory(factory_id) and active = false) or public.is_admin());
create policy prod_admin_delete on public.products for delete using (public.is_admin());

-- factory registry: the factory uploads and reads its own customers
create policy fc_owner_read on public.factory_customers for select using (public.owns_factory(factory_id) or public.is_admin());
create policy fc_owner_insert on public.factory_customers for insert
  with check (public.owns_factory(factory_id) and source = 'factory_upload');

-- people
create policy cust_self on public.customers for select using (user_id = auth.uid() or public.is_admin());
create policy amb_self on public.ambassadors for select using (user_id = auth.uid() or leader_id = auth.uid() or public.is_admin());
create policy amb_admin on public.ambassadors for all using (public.is_admin()) with check (public.is_admin());
create policy ref_owner on public.referral_links for select using (ambassador_id = auth.uid() or public.is_admin());
create policy click_owner on public.clicks for select using (ambassador_id = auth.uid() or public.is_admin());
create policy promo_admin on public.promo_codes for all using (public.is_admin()) with check (public.is_admin());

-- orders: buyer sees own; factory sees its sub-orders; admin sees all. Writes: server only.
create policy ord_buyer on public.orders for select using (buyer_user_id = auth.uid() or public.is_admin());
create policy sub_read on public.sub_orders for select using (
  public.is_admin() or public.owns_factory(factory_id)
  or exists (select 1 from public.orders o where o.id = order_id and o.buyer_user_id = auth.uid()));
create policy items_read on public.order_items for select using (
  exists (select 1 from public.sub_orders s where s.id = sub_order_id and (
    public.is_admin() or public.owns_factory(s.factory_id)
    or exists (select 1 from public.orders o where o.id = s.order_id and o.buyer_user_id = auth.uid()))));
create policy com_owner on public.commissions for select using (beneficiary_id = auth.uid() or public.is_admin());
create policy pay_owner on public.payouts for select using (beneficiary_id = auth.uid() or public.is_admin());

-- finance: admins only, read-only (writes go through post_txn / close / issue)
create policy led_admin on public.ledger_entries for select using (public.is_admin());
create policy close_admin on public.ledger_closes for select using (public.is_admin());
create policy inv_read on public.invoices for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.buyer_user_id = auth.uid()));

-- wholesale
create policy rfq_buyer on public.rfqs for select using (buyer_user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.factories f join public.products p on p.factory_id = f.id
             where p.id = product_id and f.owner_id = auth.uid())
  or exists (select 1 from public.factories f join public.products p on p.factory_id = f.id
             where f.owner_id = auth.uid() and p.category_id = rfqs.category_id));
create policy rfq_insert on public.rfqs for insert with check (buyer_user_id = auth.uid());
create policy quote_read on public.quotes for select using (public.owns_factory(factory_id) or public.is_admin()
  or exists (select 1 from public.rfqs r where r.id = rfq_id and r.buyer_user_id = auth.uid()));
create policy quote_factory on public.quotes for insert with check (public.owns_factory(factory_id) and status = 'submitted');
create policy deal_read on public.deals for select using (public.is_admin()
  or exists (select 1 from public.quotes q join public.rfqs r on r.id = q.rfq_id
             where q.id = quote_id and (r.buyer_user_id = auth.uid() or public.owns_factory(q.factory_id))));
create policy inst_read on public.deal_installments for select using (exists (select 1 from public.deals d where d.id = deal_id));
create policy group_read on public.group_orders for select using (true);

grant execute on function public.resolve_referral(text) to anon, authenticated;
grant execute on function public.create_qr_batch(text, int) to authenticated;
grant execute on function public.issue_invoice(text) to authenticated;
grant execute on function public.close_ledger_period(date, date) to authenticated;
