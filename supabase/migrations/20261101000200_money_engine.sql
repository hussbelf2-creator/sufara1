-- ════════════════════════════════════════════════════════════════════════
-- Safeer · 003 — payment capture, shipment events, commission engine,
-- refunds. Each function is one database transaction: either every ledger
-- line, status change and commission row is written, or none is.
-- Called by Edge Functions with the service role (or by admins).
-- ════════════════════════════════════════════════════════════════════════

-- Settings that priced a given order (falls back to the active version).
create or replace function public.settings_for(p_version int) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select payload from public.platform_settings where version = p_version),
    public.active_settings(),
    '{}'::jsonb);
$$;

create or replace function public.require_server() returns void
language plpgsql stable as $$
begin
  if not (auth.role() = 'service_role' or public.is_admin()) then raise exception 'forbidden'; end if;
end $$;

-- ── payment captured ────────────────────────────────────────────────────
create or replace function public.confirm_payment(p_order_id text, p_fee numeric default null, p_provider_ref text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  o public.orders; cfg jsonb; ch text; fee numeric; reserve numeric; s record;
  amb public.ambassadors; rate numeric; amount numeric; months numeric; first_deal timestamptz; email_h text;
begin
  perform public.require_server();
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'unknown order'; end if;
  if o.status <> 'pending_payment' then return 'already ' || o.status; end if;

  cfg := public.settings_for(o.settings_version);
  ch := o.channel;
  fee := coalesce(p_fee, round(o.total * coalesce((cfg -> 'costs' -> 'paymentFee' ->> ch)::numeric, 0.029), 2));
  reserve := round(o.goods * coalesce((cfg -> 'costs' -> 'returnReserve' ->> ch)::numeric, 0.01), 2);

  update public.orders set status = 'paid', paid_at = now(), payment_ref = coalesce(p_provider_ref, payment_ref) where id = o.id;
  update public.sub_orders set status = 'paid' where order_id = o.id;

  -- Cash in; the goods money is held in escrow until the return window closes.
  perform public.post_txn('payment captured', o.id, jsonb_build_array(
    jsonb_build_object('account', 'asset:gateway_clearing', 'debit', o.total - fee),
    jsonb_build_object('account', 'expense:payment_fee', 'debit', fee),
    jsonb_build_object('account', 'liability:customer_escrow', 'credit', o.goods - o.discount),
    jsonb_build_object('account', 'liability:carrier_payable', 'credit', o.shipping + o.customs),
    jsonb_build_object('account', 'liability:vat_payable', 'credit', o.vat)
  ));
  perform public.post_txn('return reserve', o.id, jsonb_build_array(
    jsonb_build_object('account', 'expense:return_reserve', 'debit', reserve),
    jsonb_build_object('account', 'liability:return_reserve', 'credit', reserve)
  ));

  if o.promo_code is not null then
    update public.promo_codes set used = used + 1 where code = o.promo_code;
  end if;

  select email_hash into email_h from public.customers where id = o.customer_id;

  -- Commissions: pending until delivery + the destination return window.
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

  -- The buyer is now a known customer of every factory in the order.
  insert into public.factory_customers (factory_id, email_hash, source, first_order_at)
  select distinct factory_id, email_h, 'order', now() from public.sub_orders where order_id = o.id
  on conflict do nothing;

  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'order.paid', 'orders', o.id, jsonb_build_object('total', o.total, 'fee', fee));
  return 'paid';
end $$;

-- ── shipment events from the carrier aggregator ────────────────────────
create or replace function public.record_shipment(p_sub_order text, p_status text, p_at timestamptz default now(), p_tracking text default null)
returns void language plpgsql security definer set search_path = public as $$
declare s public.sub_orders; o public.orders;
begin
  perform public.require_server();
  select * into s from public.sub_orders where id = p_sub_order for update;
  if s.id is null then raise exception 'unknown sub-order'; end if;
  select * into o from public.orders where id = s.order_id;
  if p_status = 'dispatched' then
    update public.sub_orders set status = 'dispatched', dispatched_at = p_at, tracking_no = coalesce(p_tracking, tracking_no) where id = s.id;
  elsif p_status = 'delivered' then
    update public.sub_orders set status = 'delivered', delivered_at = p_at where id = s.id;
    update public.commissions set unlock_at = p_at + make_interval(days => o.return_days)
     where sub_order_id = s.id and state = 'pending';
    if not exists (select 1 from public.sub_orders where order_id = o.id and delivered_at is null) then
      update public.orders set status = 'delivered', delivered_at = p_at where id = o.id;
    end if;
  elsif p_status = 'returned' then
    update public.sub_orders set returned = true where id = s.id;
    update public.commissions set state = 'void' where sub_order_id = s.id and state in ('pending', 'eligible');
  else
    raise exception 'unknown shipment status %', p_status;
  end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'shipment.' || p_status, 'sub_orders', s.id, jsonb_build_object('at', p_at, 'tracking', p_tracking));
end $$;

-- ── nightly engine: settle closed windows, unlock commissions, re-tier ──
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

  -- Tier = delivered attributed orders inside the trailing window.
  update public.ambassadors a set tier = coalesce((
    select t ->> 'id' from jsonb_array_elements(cfg -> 'ambassador' -> 'retailTiers') t
    where (t ->> 'minOrders')::int <= (
      select count(distinct o.id) from public.orders o
      where o.ambassador_id = a.user_id and o.delivered_at >= now() - make_interval(days => window_days))
    order by (t ->> 'minOrders')::int desc limit 1), a.tier);

  return jsonb_build_object('settled', settled, 'unlocked', unlocked);
end $$;

-- ── refunds (before settlement) ─────────────────────────────────────────
create or replace function public.refund_order(p_order_id text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders; open_goods numeric;
begin
  perform public.require_server();
  select * into o from public.orders where id = p_order_id for update;
  if o.status not in ('paid', 'dispatched', 'delivered') then raise exception 'order cannot be refunded in status %', o.status; end if;
  if exists (select 1 from public.sub_orders where order_id = o.id and settled) then
    raise exception 'part of the order is settled — refund through a credit note';
  end if;
  open_goods := o.goods - o.discount;
  perform public.post_txn('refund', o.id, jsonb_build_array(
    jsonb_build_object('account', 'liability:customer_escrow', 'debit', open_goods),
    jsonb_build_object('account', 'liability:carrier_payable', 'debit', o.shipping + o.customs),
    jsonb_build_object('account', 'liability:vat_payable', 'debit', o.vat),
    jsonb_build_object('account', 'asset:gateway_clearing', 'credit', o.total)
  ));
  update public.orders set status = 'refunded' where id = o.id;
  update public.sub_orders set status = 'refunded', returned = true where order_id = o.id;
  update public.commissions set state = 'void' where sub_order_id in (select id from public.sub_orders where order_id = o.id) and state <> 'paid';
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'order.refunded', 'orders', o.id, jsonb_build_object('total', o.total));
end $$;

revoke execute on function public.confirm_payment(text, numeric, text) from public, anon;
revoke execute on function public.record_shipment(text, text, timestamptz, text) from public, anon;
revoke execute on function public.run_commission_engine() from public, anon;
revoke execute on function public.refund_order(text) from public, anon;
grant execute on function public.confirm_payment(text, numeric, text) to service_role, authenticated;
grant execute on function public.record_shipment(text, text, timestamptz, text) to service_role, authenticated;
grant execute on function public.run_commission_engine() to service_role, authenticated;
grant execute on function public.refund_order(text) to service_role, authenticated;

-- ── approval creates the ambassador record (slug, code, leader) ────────
create or replace function public.admin_set_verification(p_user_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles; base text; tag text;
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
      on conflict (user_id) do nothing;
    end if;
  elsif p_status = 'rejected' then
    delete from public.user_roles where user_id = p_user_id and role in ('ambassador', 'factory');
    update public.ambassadors set status = 'suspended' where user_id = p_user_id;
  end if;

  update public.kyc_private set reviewed_by = auth.uid(), reviewed_at = now() where user_id = p_user_id;
  perform public.audit('account.verification', 'profiles', p_user_id::text,
                       jsonb_build_object('status', p_status, 'role', p.requested_panel));
end $$;

-- Leader status is an admin decision (typically an Umrah / Hajj agent).
create or replace function public.admin_set_leader(p_user_id uuid, p_is_leader boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_is_leader and exists (select 1 from public.ambassadors where user_id = p_user_id and leader_id is not null) then
    raise exception 'a team member cannot lead a team (one level only)';
  end if;
  update public.ambassadors set is_leader = p_is_leader where user_id = p_user_id;
  perform public.audit(case when p_is_leader then 'leader.grant' else 'leader.revoke' end, 'ambassadors', p_user_id::text, '{}'::jsonb);
end $$;
grant execute on function public.admin_set_leader(uuid, boolean) to authenticated;

-- Active codes for the storefront's early check (the server re-validates on
-- every order). Usage counters and limits are not exposed.
create or replace function public.public_promo_codes() returns table (code text, kind text, value numeric, min_subtotal numeric)
language sql stable security definer set search_path = public as $$
  select p.code, p.kind,
         case when p.kind = 'percent'
              then least(p.value, coalesce((public.active_settings() -> 'promo' ->> 'capRate')::numeric * 100, 4))
              else p.value end,
         p.min_subtotal
  from public.promo_codes p
  where p.active and (p.starts_at is null or p.starts_at <= now()) and (p.ends_at is null or p.ends_at >= now())
    and (p.max_uses is null or p.used < p.max_uses);
$$;
grant execute on function public.public_promo_codes() to anon, authenticated;
