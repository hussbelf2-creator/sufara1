-- ════════════════════════════════════════════════════════════════════════
-- Safeer · 007 — closes the loops between the four dashboards
--   factory approval → factory record · ambassador links & public page ·
--   RFQ attribution on the server · deal → order → instalments → ledger ·
--   factory settlements · group orders · returns · leader team · admin ops
-- ════════════════════════════════════════════════════════════════════════

-- ── helpers ─────────────────────────────────────────────────────────────
create or replace function public.slugify(p text) returns text
language sql immutable as $$
  select coalesce(nullif(trim(both '-' from lower(regexp_replace(coalesce(p, ''), '[^a-zA-Z0-9]+', '-', 'g'))), ''), 'x');
$$;

create or replace function public.zone_return_days(p_country text, p_cfg jsonb default null) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(
    ((coalesce(p_cfg, public.active_settings()) -> 'shipping' -> 'consolidated'
       -> (coalesce(p_cfg, public.active_settings()) -> 'shipping' -> 'countryZone' ->> lower(p_country))) ->> 'returnDays')::int,
    14);
$$;

-- ── 1. factory approval creates the factory and links its owner ─────────
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
      -- factory: one record per owner, KYB follows the account decision
      select id into fid from public.factories where owner_id = p_user_id limit 1;
      if fid is null then
        fid := left(public.slugify(coalesce(nullif(p.company, ''), split_part(p.email, '@', 1))), 30);
        if exists (select 1 from public.factories where id = fid) then
          fid := fid || '-' || substr(encode(gen_random_bytes(2), 'hex'), 1, 4);
        end if;
        insert into public.factories (id, owner_id, name_ar, name_en, city, cr_number, vat_number, kyb_status)
        values (fid, p_user_id, coalesce(nullif(p.company, ''), p.full_name), coalesce(nullif(p.company, ''), p.full_name),
                coalesce(p.city, ''), p.cr_number, p.vat_number, 'verified');
      else
        update public.factories set kyb_status = 'verified' where id = fid;
      end if;
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

create or replace function public.admin_set_ambassador_status(p_user_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'bad status'; end if;
  update public.ambassadors set status = p_status where user_id = p_user_id;
  update public.referral_links set active = (p_status = 'active') where ambassador_id = p_user_id;
  perform public.audit('ambassador.' || p_status, 'ambassadors', p_user_id::text, '{}'::jsonb);
end $$;

create or replace function public.admin_publish_product(p_id text, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_active and not exists (select 1 from public.products p join public.factories f on f.id = p.factory_id
                              where p.id = p_id and f.kyb_status = 'verified') then
    raise exception 'factory is not verified';
  end if;
  update public.products set active = p_active where id = p_id;
  perform public.audit(case when p_active then 'product.publish' else 'product.unpublish' end, 'products', p_id, '{}'::jsonb);
end $$;

-- ── 2. ambassador links and the public landing page ────────────────────
create or replace function public.create_referral_link(p_factory text) returns text
language plpgsql security definer set search_path = public as $$
declare me public.ambassadors; c text; existing text;
begin
  select * into me from public.ambassadors where user_id = auth.uid();
  if me.user_id is null or me.status <> 'active' then raise exception 'not an active ambassador'; end if;
  if not exists (select 1 from public.factories where id = p_factory and kyb_status = 'verified') then raise exception 'unknown factory'; end if;
  select code into existing from public.referral_links where ambassador_id = me.user_id and factory_id = p_factory and batch_id is null and active;
  if existing is not null then return existing; end if;
  c := split_part(me.code, '-', 1) || '-' || upper(left(regexp_replace(p_factory, '[^a-zA-Z0-9]', '', 'g'), 6)) || '-' || upper(substr(encode(gen_random_bytes(2), 'hex'), 1, 3));
  insert into public.referral_links (code, ambassador_id, factory_id, discount_pct)
  values (c, me.user_id, p_factory, coalesce((public.active_settings() -> 'promo' ->> 'ambassadorCodeRate')::numeric * 100, 4));
  perform public.audit('referral.create', 'referral_links', c, jsonb_build_object('factory', p_factory));
  return c;
end $$;

-- What a visitor may see about an ambassador: first name, country, tier, and the page code.
create or replace function public.ambassador_page(p_slug text, p_factory text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'slug', a.slug,
    'name', split_part(coalesce(nullif(p.full_name, ''), 'Safeer'), ' ', 1),
    'country', p.country,
    'tier', a.tier,
    'is_leader', a.is_leader,
    'code', (select r.code from public.referral_links r where r.ambassador_id = a.user_id and r.factory_id = p_factory and r.active and r.batch_id is null limit 1))
  from public.ambassadors a join public.profiles p on p.id = a.user_id
  where a.slug = p_slug and a.status = 'active';
$$;

create or replace function public.my_links() returns table (code text, factory_id text, discount_pct numeric, clicks bigint, orders bigint)
language sql stable security definer set search_path = public as $$
  select r.code, r.factory_id, r.discount_pct,
         (select count(*) from public.clicks c where c.code = r.code),
         (select count(*) from public.orders o where o.referral_code = r.code and o.paid_at is not null)
  from public.referral_links r where r.ambassador_id = auth.uid() and r.active
  order by r.created_at desc;
$$;

-- ── 3. RFQ attribution on the server only ───────────────────────────────
drop policy if exists rfq_insert on public.rfqs;
create policy rfq_insert on public.rfqs for insert with check (buyer_user_id = auth.uid() and ambassador_id is null);

create or replace function public.create_rfq(p_product text, p_category text, p_qty int, p_country text, p_port text,
                                            p_incoterm text, p_notes text, p_click uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare rid uuid; amb uuid; days int := coalesce((public.active_settings() -> 'ambassador' ->> 'attributionDays')::int, 30);
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  if p_qty < 1 then raise exception 'bad quantity'; end if;
  if p_incoterm not in ('DDP', 'CIF', 'FOB', 'EXW') then raise exception 'bad incoterm'; end if;
  if p_click is not null then
    select c.ambassador_id into amb from public.clicks c join public.ambassadors a on a.user_id = c.ambassador_id
     where c.id = p_click and c.created_at >= now() - make_interval(days => days) and a.status = 'active' and a.user_id <> auth.uid();
  end if;
  insert into public.rfqs (buyer_user_id, product_id, category_id, qty, country, port, incoterm, notes, ambassador_id)
  values (auth.uid(), p_product,
          coalesce(p_category, (select category_id from public.products where id = p_product)),
          p_qty, lower(left(p_country, 8)), p_port, p_incoterm, left(p_notes, 1000), amb)
  returning id into rid;
  return rid;
end $$;

-- ── 4. deal → order → instalments → payment → commissions ──────────────
alter table public.orders alter column ship_method drop not null;
alter table public.deals add column if not exists paid_at timestamptz;

create or replace function public.accept_quote(p_quote uuid, p_plan jsonb default '[{"days":0,"share":0.3},{"days":30,"share":0.7}]')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  q public.quotes; r public.rfqs; d uuid; total numeric; s numeric := 0; i int := 0; step jsonb; amt numeric;
  allocated numeric := 0; n int; cust uuid; oid text; cfg jsonb := public.active_settings(); take_rate numeric; known boolean;
  email_h text; buyer_email text; buyer_name text;
begin
  select * into q from public.quotes where id = p_quote for update;
  select * into r from public.rfqs where id = q.rfq_id for update;
  if r.buyer_user_id is distinct from auth.uid() then raise exception 'forbidden'; end if;
  if q.status <> 'submitted' or q.valid_until < current_date then raise exception 'quote not available'; end if;
  if r.status = 'awarded' then raise exception 'already awarded'; end if;
  n := jsonb_array_length(p_plan);
  if n < 1 or n > 6 then raise exception 'plan must have 1–6 instalments'; end if;
  select sum((x ->> 'share')::numeric) into s from jsonb_array_elements(p_plan) x;
  if round(s, 4) <> 1 then raise exception 'instalment shares must add up to 100%%'; end if;

  total := round(q.unit_price * r.qty, 2);
  take_rate := coalesce((cfg -> 'take' -> 'wholesale' ->> 'value')::numeric, 0.06);

  -- the buyer as a customer (hash of the account e-mail)
  select u.email, coalesce(p.full_name, '') into buyer_email, buyer_name
    from auth.users u left join public.profiles p on p.id = u.id where u.id = auth.uid();
  email_h := encode(digest(lower(coalesce(buyer_email, '')), 'sha256'), 'hex');
  insert into public.customers (email_hash, user_id, country) values (email_h, auth.uid(), r.country)
  on conflict (email_hash) do update set user_id = coalesce(customers.user_id, excluded.user_id)
  returning id into cust;
  known := exists (select 1 from public.factory_customers where factory_id = q.factory_id and email_hash = email_h);

  oid := 'SFR-' || to_char(now(), 'YYMM') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
  insert into public.orders (id, customer_id, buyer_user_id, buyer_name, buyer_email, channel, country, port,
                             incoterm, customs_party, ship_method, goods, total, ambassador_id,
                             settings_version, return_days)
  values (oid, cust, auth.uid(), buyer_name, coalesce(buyer_email, ''), 'wholesale', r.country, r.port,
          case when r.incoterm in ('DDP', 'CIF', 'FOB') then r.incoterm else 'FOB' end,
          case when r.incoterm = 'DDP' then 'platform' else 'buyer' end, 'sea', total, total, r.ambassador_id,
          coalesce((cfg ->> 'version')::int, 1), public.zone_return_days(r.country, cfg));
  insert into public.sub_orders (id, order_id, factory_id, goods, take_rate, take, new_customer)
  values (oid || '-1', oid, q.factory_id, total, take_rate, round(total * take_rate, 2), not known);
  if r.product_id is not null then
    insert into public.order_items (sub_order_id, product_id, qty, unit_price, line_total)
    values (oid || '-1', r.product_id, r.qty, q.unit_price, total);
  end if;

  insert into public.deals (quote_id, total, order_id) values (q.id, total, oid) returning id into d;
  for step in select * from jsonb_array_elements(p_plan) loop
    i := i + 1;
    amt := case when i = n then total - allocated else round(total * (step ->> 'share')::numeric, 2) end;
    allocated := allocated + amt;
    insert into public.deal_installments (deal_id, seq, due_on, share, amount)
    values (d, i, current_date + coalesce((step ->> 'days')::int, 0), (step ->> 'share')::numeric, amt);
  end loop;
  update public.quotes set status = case when id = q.id then 'accepted' else 'rejected' end where rfq_id = r.id;
  update public.rfqs set status = 'awarded' where id = r.id;
  perform public.audit('deal.create', 'deals', d::text, jsonb_build_object('quote', q.id, 'total', total, 'order', oid));
  return d;
end $$;

-- Bank transfers for instalments are recorded by finance; the last one pays the order.
create or replace function public.admin_record_instalment(p_deal uuid, p_seq int, p_ref text default null) returns text
language plpgsql security definer set search_path = public as $$
declare d public.deals; inst public.deal_installments; result text := 'instalment recorded';
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into d from public.deals where id = p_deal for update;
  select * into inst from public.deal_installments where deal_id = p_deal and seq = p_seq for update;
  if inst.id is null then raise exception 'unknown instalment'; end if;
  if inst.status = 'paid' then return 'already paid'; end if;
  update public.deal_installments set status = 'paid', paid_at = now() where id = inst.id;
  perform public.post_txn('deal instalment ' || p_seq || coalesce(' · ' || p_ref, ''), d.order_id, jsonb_build_array(
    jsonb_build_object('account', 'asset:bank', 'debit', inst.amount),
    jsonb_build_object('account', 'liability:deal_deposits', 'credit', inst.amount)));
  if not exists (select 1 from public.deal_installments where deal_id = p_deal and status <> 'paid') then
    update public.deals set paid_at = now() where id = p_deal;
    perform public.confirm_payment(d.order_id, 0, 'deal:' || p_deal, 'liability:deal_deposits');
    result := 'deal fully paid';
  end if;
  perform public.audit('deal.instalment', 'deals', p_deal::text, jsonb_build_object('seq', p_seq, 'amount', inst.amount, 'ref', p_ref));
  return result;
end $$;

-- confirm_payment gains the funding account (gateway for cards, deposits for deals).
drop function if exists public.confirm_payment(text, numeric, text);
create or replace function public.confirm_payment(p_order_id text, p_fee numeric default null, p_provider_ref text default null,
                                                  p_funding text default 'asset:gateway_clearing')
returns text language plpgsql security definer set search_path = public as $$
declare
  o public.orders; cfg jsonb; ch text; fee numeric; reserve numeric; s record;
  amb public.ambassadors; rate numeric; amount numeric; months numeric; first_deal timestamptz; email_h text;
begin
  perform public.require_server();
  if p_funding not in ('asset:gateway_clearing', 'liability:deal_deposits') then raise exception 'bad funding account'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'unknown order'; end if;
  if o.status <> 'pending_payment' then return 'already ' || o.status; end if;

  cfg := public.settings_for(o.settings_version);
  ch := o.channel;
  fee := coalesce(p_fee, round(o.total * coalesce((cfg -> 'costs' -> 'paymentFee' ->> ch)::numeric, 0.029), 2));
  reserve := round(o.goods * coalesce((cfg -> 'costs' -> 'returnReserve' ->> ch)::numeric, 0.01), 2);

  update public.orders set status = 'paid', paid_at = now(), payment_ref = coalesce(p_provider_ref, payment_ref) where id = o.id;
  update public.sub_orders set status = 'paid' where order_id = o.id;

  perform public.post_txn('payment captured', o.id, jsonb_build_array(
    jsonb_build_object('account', p_funding, 'debit', o.total - fee),
    jsonb_build_object('account', 'expense:payment_fee', 'debit', fee),
    jsonb_build_object('account', 'liability:customer_escrow', 'credit', o.goods - o.discount),
    jsonb_build_object('account', 'liability:carrier_payable', 'credit', o.shipping + o.customs),
    jsonb_build_object('account', 'liability:vat_payable', 'credit', o.vat)
  ));
  perform public.post_txn('return reserve', o.id, jsonb_build_array(
    jsonb_build_object('account', 'expense:return_reserve', 'debit', reserve),
    jsonb_build_object('account', 'liability:return_reserve', 'credit', reserve)
  ));

  if o.promo_code is not null then update public.promo_codes set used = used + 1 where code = o.promo_code; end if;
  if o.group_order_id is not null then
    update public.group_orders set participants = participants + 1 where id = o.group_order_id;
  end if;
  select email_hash into email_h from public.customers where id = o.customer_id;

  if o.ambassador_id is not null then
    select * into amb from public.ambassadors where user_id = o.ambassador_id;
    for s in select * from public.sub_orders where order_id = o.id loop
      rate := 0;
      if ch = 'wholesale' then
        select min(x.paid_at) into first_deal from public.orders x
         where x.customer_id = o.customer_id and x.ambassador_id = o.ambassador_id and x.channel = 'wholesale' and x.paid_at is not null;
        months := extract(epoch from (now() - coalesce(first_deal, now()))) / (30.4375 * 86400);
        if months < coalesce((cfg -> 'ambassador' ->> 'wholesaleRecurringMonths')::numeric, 12) then
          rate := coalesce((cfg -> 'ambassador' -> 'wholesale' ->> 'value')::numeric, 0.02);
        end if;
      elsif s.new_customer or coalesce(cfg -> 'ambassador' ->> 'retailScope', 'first_order') = 'every_order_in_window' then
        rate := coalesce(
          (select (t ->> 'rate')::numeric from jsonb_array_elements(cfg -> 'ambassador' -> 'retailTiers') t where t ->> 'id' = amb.tier),
          (select (t ->> 'rate')::numeric from jsonb_array_elements(cfg -> 'ambassador' -> 'retailTiers') t limit 1),
          0.05);
      end if;
      if rate > 0 then
        amount := round(s.goods * rate, 2);
        insert into public.commissions (sub_order_id, beneficiary_id, kind, rate, base, amount)
        values (s.id, amb.user_id, 'ambassador', rate, s.goods, amount) on conflict do nothing;
        if amb.leader_id is not null and coalesce((cfg -> 'ambassador' ->> 'leaderBonus')::numeric, 0) > 0 then
          insert into public.commissions (sub_order_id, beneficiary_id, kind, rate, base, amount)
          values (s.id, amb.leader_id, 'leader', (cfg -> 'ambassador' ->> 'leaderBonus')::numeric, s.goods,
                  round(s.goods * (cfg -> 'ambassador' ->> 'leaderBonus')::numeric, 2)) on conflict do nothing;
        end if;
      end if;
    end loop;
  end if;

  insert into public.factory_customers (factory_id, email_hash, source, first_order_at)
  select distinct factory_id, email_h, 'order', now() from public.sub_orders where order_id = o.id
  on conflict do nothing;

  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'order.paid', 'orders', o.id, jsonb_build_object('total', o.total, 'fee', fee, 'funding', p_funding));
  return 'paid';
end $$;
revoke execute on function public.confirm_payment(text, numeric, text, text) from public, anon;
grant execute on function public.confirm_payment(text, numeric, text, text) to service_role, authenticated;

-- ── 5. factory settlements ──────────────────────────────────────────────
create table if not exists public.factory_payouts (
  id bigint generated always as identity primary key,
  factory_id text not null references public.factories (id),
  amount numeric(14, 2) not null check (amount > 0),
  reference text,
  paid_by uuid references auth.users (id),
  paid_at timestamptz not null default now()
);
alter table public.factory_payouts enable row level security;
create policy fp_read on public.factory_payouts for select using (public.is_admin() or public.owns_factory(factory_id));

-- released (window closed) − already paid = what the platform owes the factory now
create or replace function public.factory_balance(p_factory text) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_admin() or public.owns_factory(p_factory) then jsonb_build_object(
    'held', coalesce((select sum(s.goods - s.take) from public.sub_orders s
                      where s.factory_id = p_factory and not s.settled and not s.returned and s.status not in ('pending_payment', 'refunded', 'cancelled')), 0),
    'released', coalesce((select sum(s.goods - s.take) from public.sub_orders s where s.factory_id = p_factory and s.settled), 0),
    'paid', coalesce((select sum(amount) from public.factory_payouts where factory_id = p_factory), 0),
    'due', coalesce((select sum(s.goods - s.take) from public.sub_orders s where s.factory_id = p_factory and s.settled), 0)
           - coalesce((select sum(amount) from public.factory_payouts where factory_id = p_factory), 0))
  else null end;
$$;

create or replace function public.admin_pay_factory(p_factory text, p_reference text) returns numeric
language plpgsql security definer set search_path = public as $$
declare due numeric;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  perform 1 from public.factories where id = p_factory for update;
  due := (public.factory_balance(p_factory) ->> 'due')::numeric;
  if coalesce(due, 0) <= 0 then raise exception 'nothing due'; end if;
  insert into public.factory_payouts (factory_id, amount, reference, paid_by) values (p_factory, due, p_reference, auth.uid());
  perform public.post_txn('factory settlement ' || p_factory || coalesce(' · ' || p_reference, ''), null, jsonb_build_array(
    jsonb_build_object('account', 'liability:factory_payable', 'debit', due),
    jsonb_build_object('account', 'asset:bank', 'credit', due)));
  perform public.audit('factory.payout', 'factories', p_factory, jsonb_build_object('amount', due, 'ref', p_reference));
  return due;
end $$;

-- ── 6. group orders (a real group, not a discount) ──────────────────────
alter table public.group_orders add column if not exists code text unique;
alter table public.group_orders add column if not exists participants int not null default 0;

create or replace function public.create_group_order(p_country text, p_city text, p_days int default 10) returns text
language plpgsql security definer set search_path = public as $$
declare me public.ambassadors; c text; minp int := coalesce((public.active_settings() -> 'shipping' -> 'groupOrder' ->> 'minParticipants')::int, 5);
begin
  select * into me from public.ambassadors where user_id = auth.uid() and status = 'active';
  if me.user_id is null then raise exception 'ambassadors only'; end if;
  if coalesce((public.active_settings() -> 'shipping' -> 'groupOrder' ->> 'enabled')::boolean, true) is false then raise exception 'group orders are off'; end if;
  c := 'G-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 5));
  insert into public.group_orders (organiser_ambassador_id, country, city, min_participants, closes_at, code)
  values (me.user_id, lower(left(p_country, 2)), p_city, minp, now() + make_interval(days => greatest(1, least(p_days, 30))), c);
  perform public.audit('group.create', 'group_orders', c, jsonb_build_object('country', p_country));
  return c;
end $$;

create or replace function public.resolve_group(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', g.id, 'code', g.code, 'country', g.country, 'city', g.city,
                            'participants', g.participants, 'min', g.min_participants, 'closes_at', g.closes_at, 'status', g.status)
  from public.group_orders g where g.code = upper(trim(p_code)) and g.status = 'open' and g.closes_at > now();
$$;

-- ── 7. returns ──────────────────────────────────────────────────────────
create table if not exists public.return_requests (
  id bigint generated always as identity primary key,
  sub_order_id text not null references public.sub_orders (id),
  buyer_user_id uuid not null references auth.users (id),
  reason text not null check (reason in ('damaged', 'size', 'notAsDescribed', 'other')),
  note text,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'received')),
  decided_by uuid references auth.users (id), decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (sub_order_id)
);
alter table public.return_requests enable row level security;
create policy rr_read on public.return_requests for select using (
  buyer_user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.sub_orders s where s.id = sub_order_id and public.owns_factory(s.factory_id)));

create or replace function public.request_return(p_sub_order text, p_reason text, p_note text) returns bigint
language plpgsql security definer set search_path = public as $$
declare s public.sub_orders; o public.orders; rid bigint;
begin
  select * into s from public.sub_orders where id = p_sub_order;
  select * into o from public.orders where id = s.order_id;
  if o.buyer_user_id is distinct from auth.uid() then raise exception 'forbidden'; end if;
  if s.delivered_at is null then raise exception 'not delivered yet'; end if;
  if s.delivered_at + make_interval(days => o.return_days) < now() then raise exception 'return window closed'; end if;
  insert into public.return_requests (sub_order_id, buyer_user_id, reason, note)
  values (s.id, auth.uid(), p_reason, left(p_note, 1000)) returning id into rid;
  perform public.audit('return.request', 'return_requests', rid::text, jsonb_build_object('sub_order', s.id, 'reason', p_reason));
  return rid;
end $$;

-- Refunds the goods of one sub-order before it is settled (shipping is kept).
create or replace function public.refund_sub_order(p_sub_order text) returns numeric
language plpgsql security definer set search_path = public as $$
declare s public.sub_orders; amt numeric;
begin
  perform public.require_server();
  select * into s from public.sub_orders where id = p_sub_order for update;
  if s.settled then raise exception 'sub-order already settled — issue a credit note'; end if;
  if s.status = 'refunded' then return 0; end if;
  amt := s.goods - s.discount;
  perform public.post_txn('sub-order refund', s.order_id, jsonb_build_array(
    jsonb_build_object('account', 'liability:customer_escrow', 'debit', amt, 'sub_order_id', s.id),
    jsonb_build_object('account', 'asset:gateway_clearing', 'credit', amt, 'sub_order_id', s.id)));
  update public.sub_orders set status = 'refunded', returned = true where id = s.id;
  update public.commissions set state = 'void' where sub_order_id = s.id and state <> 'paid';
  return amt;
end $$;

create or replace function public.admin_decide_return(p_id bigint, p_decision text) returns void
language plpgsql security definer set search_path = public as $$
declare r public.return_requests;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into r from public.return_requests where id = p_id for update;
  if r.id is null then raise exception 'unknown return'; end if;
  if p_decision = 'approved' and r.status = 'requested' then
    update public.return_requests set status = 'approved', decided_by = auth.uid(), decided_at = now() where id = p_id;
    perform public.record_shipment(r.sub_order_id, 'returned');      -- voids commissions
  elsif p_decision = 'rejected' and r.status = 'requested' then
    update public.return_requests set status = 'rejected', decided_by = auth.uid(), decided_at = now() where id = p_id;
  elsif p_decision = 'received' and r.status = 'approved' then
    update public.return_requests set status = 'received', decided_by = auth.uid(), decided_at = now() where id = p_id;
    perform public.refund_sub_order(r.sub_order_id);
  else
    raise exception 'cannot % a % return', p_decision, r.status;
  end if;
  perform public.audit('return.' || p_decision, 'return_requests', p_id::text, jsonb_build_object('sub_order', r.sub_order_id));
end $$;

-- The engine must not settle a sub-order with an open return request.
create or replace function public.run_commission_engine() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s record; c record; settled int := 0; unlocked int := 0; cfg jsonb := public.active_settings();
  window_days int := coalesce((cfg -> 'ambassador' ->> 'tierWindowDays')::int, 90);
begin
  perform public.require_server();
  for s in
    select so.*, o.return_days from public.sub_orders so join public.orders o on o.id = so.order_id
    where so.delivered_at is not null and not so.returned and not so.settled
      and so.delivered_at + make_interval(days => o.return_days) <= now()
      and not exists (select 1 from public.return_requests rr where rr.sub_order_id = so.id and rr.status in ('requested', 'approved'))
    for update of so
  loop
    perform public.post_txn('escrow released', s.order_id, jsonb_build_array(
      jsonb_build_object('account', 'liability:customer_escrow', 'debit', s.goods - s.discount, 'sub_order_id', s.id),
      jsonb_build_object('account', 'expense:discount', 'debit', s.discount, 'sub_order_id', s.id),
      jsonb_build_object('account', 'liability:factory_payable', 'credit', s.goods - s.take, 'sub_order_id', s.id),
      jsonb_build_object('account', 'revenue:take', 'credit', s.take, 'sub_order_id', s.id)
    ));
    update public.sub_orders set settled = true, status = 'closed' where id = s.id;
    settled := settled + 1;
    for c in select * from public.commissions where sub_order_id = s.id and state = 'pending' loop
      perform public.post_txn('commission earned', s.order_id, jsonb_build_array(
        jsonb_build_object('account', 'expense:' || c.kind || '_commission', 'debit', c.amount, 'sub_order_id', s.id),
        jsonb_build_object('account', 'liability:ambassador_payable', 'credit', c.amount, 'sub_order_id', s.id)
      ));
      update public.commissions set state = 'eligible' where id = c.id;
      unlocked := unlocked + 1;
    end loop;
  end loop;

  update public.ambassadors a set tier = coalesce((
    select t ->> 'id' from jsonb_array_elements(cfg -> 'ambassador' -> 'retailTiers') t
    where (t ->> 'minOrders')::int <= (
      select count(distinct o.id) from public.orders o
      where o.ambassador_id = a.user_id and o.delivered_at >= now() - make_interval(days => window_days))
    order by (t ->> 'minOrders')::int desc limit 1), a.tier);

  return jsonb_build_object('settled', settled, 'unlocked', unlocked);
end $$;

-- ── 8. leader team (one level) ──────────────────────────────────────────
create or replace function public.my_team() returns table (
  user_id uuid, name text, country text, tier text, status text, clicks bigint, delivered_orders bigint,
  sales numeric, commission numeric, leader_bonus numeric, joined timestamptz)
language sql stable security definer set search_path = public as $$
  select a.user_id, p.full_name, p.country, a.tier, a.status,
         (select count(*) from public.clicks c where c.ambassador_id = a.user_id),
         (select count(*) from public.orders o where o.ambassador_id = a.user_id and o.delivered_at is not null),
         coalesce((select sum(o.goods) from public.orders o where o.ambassador_id = a.user_id and o.paid_at is not null), 0),
         coalesce((select sum(c.amount) from public.commissions c where c.beneficiary_id = a.user_id and c.state <> 'void'), 0),
         coalesce((select sum(c.amount) from public.commissions c join public.sub_orders s on s.id = c.sub_order_id
                   join public.orders o on o.id = s.order_id
                   where c.beneficiary_id = auth.uid() and c.kind = 'leader' and o.ambassador_id = a.user_id and c.state <> 'void'), 0),
         a.created_at
  from public.ambassadors a join public.profiles p on p.id = a.user_id
  where a.leader_id = auth.uid()
    and exists (select 1 from public.ambassadors me where me.user_id = auth.uid() and me.is_leader);
$$;

-- ── 9. admin read models ────────────────────────────────────────────────
create or replace view public.admin_orders with (security_barrier = true) as
  select o.id, o.created_at, o.paid_at, o.status::text as status, o.channel, o.country, o.ship_method, o.incoterm,
         o.goods, o.discount, o.shipping, o.customs, o.vat, o.total, o.invoice_no, o.buyer_name, o.buyer_email,
         (select code from public.ambassadors a where a.user_id = o.ambassador_id) as ambassador,
         (select jsonb_agg(jsonb_build_object('id', s.id, 'factory_id', s.factory_id, 'goods', s.goods, 'status', s.status,
                                              'tracking_no', s.tracking_no, 'delivered_at', s.delivered_at, 'settled', s.settled, 'returned', s.returned)
                           order by s.id)
            from public.sub_orders s where s.order_id = o.id) as subs
  from public.orders o where public.is_admin();

create or replace view public.admin_ambassadors with (security_barrier = true) as
  select a.user_id, a.slug, a.code, a.tier, a.is_leader, a.status, a.acquisition_channel, a.created_at,
         p.full_name, p.country, p.email, (select l.code from public.ambassadors l where l.user_id = a.leader_id) as leader_code,
         (select count(*) from public.ambassadors m where m.leader_id = a.user_id) as team_size,
         coalesce((select sum(c.amount) from public.commissions c where c.beneficiary_id = a.user_id and c.state <> 'void'), 0) as earned
  from public.ambassadors a join public.profiles p on p.id = a.user_id where public.is_admin();

create or replace view public.admin_factories with (security_barrier = true) as
  select f.id, f.name_ar, f.name_en, f.city, f.kyb_status::text as kyb_status, f.cr_number, p.email as owner_email,
         (select count(*) from public.products x where x.factory_id = f.id) as products,
         (select count(*) from public.products x where x.factory_id = f.id and x.active) as active_products,
         public.factory_balance(f.id) as balance
  from public.factories f left join public.profiles p on p.id = f.owner_id where public.is_admin();

create or replace view public.admin_returns with (security_barrier = true) as
  select r.id, r.sub_order_id, r.reason, r.note, r.status, r.created_at, s.goods, s.discount, s.factory_id, s.settled,
         o.id as order_id, o.buyer_name, o.country
  from public.return_requests r join public.sub_orders s on s.id = r.sub_order_id join public.orders o on o.id = s.order_id
  where public.is_admin();

grant select on public.admin_orders, public.admin_ambassadors, public.admin_factories, public.admin_returns to authenticated;
grant execute on function public.admin_set_ambassador_status(uuid, text) to authenticated;
grant execute on function public.admin_publish_product(text, boolean) to authenticated;
grant execute on function public.create_referral_link(text) to authenticated;
grant execute on function public.ambassador_page(text, text) to anon, authenticated;
grant execute on function public.my_links() to authenticated;
grant execute on function public.create_rfq(text, text, int, text, text, text, text, uuid) to authenticated;
grant execute on function public.admin_record_instalment(uuid, int, text) to authenticated;
grant execute on function public.factory_balance(text) to authenticated;
grant execute on function public.admin_pay_factory(text, text) to authenticated;
grant execute on function public.create_group_order(text, text, int) to authenticated;
grant execute on function public.resolve_group(text) to anon, authenticated;
grant execute on function public.request_return(text, text, text) to authenticated;
grant execute on function public.refund_sub_order(text) to service_role, authenticated;
grant execute on function public.admin_decide_return(bigint, text) to authenticated;
grant execute on function public.my_team() to authenticated;
