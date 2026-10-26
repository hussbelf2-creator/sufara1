-- ════════════════════════════════════════════════════════════════════════
-- Safeer · 008 — fixes from the logic audit
--   1. domestic wholesale deals carry 15% VAT
--   2. a sub-order refund returns its share of VAT
--   3. every confirmed payment issues the tax invoice (cards, transfers, deals)
--   4. finance can confirm a bank transfer for a retail order
--   5. e-wallet payout details (launch markets without IBAN)
-- ════════════════════════════════════════════════════════════════════════

-- 1. accept_quote with VAT for Saudi deliveries -------------------------------
create or replace function public.accept_quote(p_quote uuid, p_plan jsonb default '[{"days":0,"share":0.3},{"days":30,"share":0.7}]')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  q public.quotes; r public.rfqs; d uuid; goods numeric; vat numeric; total numeric; s numeric := 0; i int := 0; step jsonb; amt numeric;
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

  goods := round(q.unit_price * r.qty, 2);
  vat := case when lower(r.country) = 'sa' then round(goods * coalesce((cfg -> 'tax' ->> 'domesticVat')::numeric, 0.15), 2) else 0 end;
  total := goods + vat;
  take_rate := coalesce((cfg -> 'take' -> 'wholesale' ->> 'value')::numeric, 0.06);

  select u.email, coalesce(p.full_name, '') into buyer_email, buyer_name
    from auth.users u left join public.profiles p on p.id = u.id where u.id = auth.uid();
  email_h := encode(digest(lower(coalesce(buyer_email, '')), 'sha256'), 'hex');
  insert into public.customers (email_hash, user_id, country) values (email_h, auth.uid(), r.country)
  on conflict (email_hash) do update set user_id = coalesce(customers.user_id, excluded.user_id)
  returning id into cust;
  known := exists (select 1 from public.factory_customers where factory_id = q.factory_id and email_hash = email_h);

  oid := 'SFR-' || to_char(now(), 'YYMM') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
  insert into public.orders (id, customer_id, buyer_user_id, buyer_name, buyer_email, channel, country, port,
                             incoterm, customs_party, ship_method, goods, vat, total, ambassador_id,
                             settings_version, return_days)
  values (oid, cust, auth.uid(), buyer_name, coalesce(buyer_email, ''), 'wholesale', r.country, r.port,
          case when r.incoterm in ('DDP', 'CIF', 'FOB') then r.incoterm else 'FOB' end,
          case when r.incoterm = 'DDP' then 'platform' else 'buyer' end, 'sea', goods, vat, total, r.ambassador_id,
          coalesce((cfg ->> 'version')::int, 1), public.zone_return_days(r.country, cfg));
  insert into public.sub_orders (id, order_id, factory_id, goods, take_rate, take, new_customer)
  values (oid || '-1', oid, q.factory_id, goods, take_rate, round(goods * take_rate, 2), not known);
  if r.product_id is not null then
    insert into public.order_items (sub_order_id, product_id, qty, unit_price, line_total)
    values (oid || '-1', r.product_id, r.qty, q.unit_price, goods);
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
  perform public.audit('deal.create', 'deals', d::text, jsonb_build_object('quote', q.id, 'total', total, 'vat', vat, 'order', oid));
  return d;
end $$;

-- 2. refund with the VAT share --------------------------------------------
create or replace function public.refund_sub_order(p_sub_order text) returns numeric
language plpgsql security definer set search_path = public as $$
declare s public.sub_orders; o public.orders; goods_part numeric; vat_part numeric;
begin
  perform public.require_server();
  select * into s from public.sub_orders where id = p_sub_order for update;
  select * into o from public.orders where id = s.order_id;
  if s.settled then raise exception 'sub-order already settled — issue a credit note'; end if;
  if s.status = 'refunded' then return 0; end if;
  goods_part := s.goods - s.discount;
  vat_part := case when o.goods > 0 then round(o.vat * s.goods / o.goods, 2) else 0 end;
  perform public.post_txn('sub-order refund', s.order_id, jsonb_build_array(
    jsonb_build_object('account', 'liability:customer_escrow', 'debit', goods_part, 'sub_order_id', s.id),
    jsonb_build_object('account', 'liability:vat_payable', 'debit', vat_part, 'sub_order_id', s.id),
    jsonb_build_object('account', 'asset:gateway_clearing', 'credit', goods_part + vat_part, 'sub_order_id', s.id)));
  update public.sub_orders set status = 'refunded', returned = true where id = s.id;
  update public.commissions set state = 'void' where sub_order_id = s.id and state <> 'paid';
  perform public.audit('order.sub_refund', 'sub_orders', s.id, jsonb_build_object('goods', goods_part, 'vat', vat_part));
  return goods_part + vat_part;
end $$;

-- 3. the invoice follows the payment, whatever the channel -----------------
create or replace function public.after_payment_invoice() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and old.status = 'pending_payment' then
    perform public.issue_invoice(new.id);
  end if;
  return new;
end $$;
drop trigger if exists orders_issue_invoice on public.orders;
create trigger orders_issue_invoice after update of status on public.orders
  for each row execute function public.after_payment_invoice();

-- issue_invoice is reached from the trigger inside definer functions; allow the definer context.
create or replace function public.issue_invoice(p_order_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o public.orders; yr int := extract(year from now())::int; nxt int; icv_ int;
  prev text; body jsonb; no text; h text; existing public.invoices;
begin
  select * into o from public.orders where id = p_order_id;
  if o.id is null then raise exception 'unknown order'; end if;
  if not (public.is_admin() or auth.role() = 'service_role' or o.buyer_user_id = auth.uid() or pg_trigger_depth() > 0) then
    raise exception 'forbidden';
  end if;
  select * into existing from public.invoices where order_id = p_order_id;
  if existing.invoice_no is not null then
    return jsonb_build_object('invoice_no', existing.invoice_no, 'icv', existing.icv, 'hash', existing.hash, 'previous_hash', existing.previous_hash);
  end if;
  if o.status not in ('paid', 'dispatched', 'delivered', 'closed') then raise exception 'order not paid'; end if;
  insert into public.invoice_counters (year, last_value) values (yr, 0) on conflict do nothing;
  update public.invoice_counters set last_value = last_value + 1 where year = yr returning last_value into nxt;
  select coalesce(max(icv), 0) + 1 into icv_ from public.invoices;
  prev := coalesce((select hash from public.invoices order by icv desc limit 1), encode(digest('0', 'sha256'), 'hex'));
  no := 'INV-' || yr || '-' || lpad(nxt::text, 7, '0');
  body := jsonb_build_object(
    'invoice_no', no, 'icv', icv_, 'order_id', o.id, 'issued_at', now(),
    'seller_vat', (public.active_settings() -> 'tax' ->> 'sellerVatNo'),
    'goods', o.goods, 'discount', o.discount, 'shipping', o.shipping, 'customs', o.customs,
    'vat', o.vat, 'total', o.total, 'country', o.country, 'zero_rated', o.vat = 0);
  h := encode(digest(body::text || '|' || prev, 'sha256'), 'hex');
  insert into public.invoices (invoice_no, icv, order_id, payload, previous_hash, hash) values (no, icv_, o.id, body, prev, h);
  update public.orders set invoice_no = no where id = o.id;
  return jsonb_build_object('invoice_no', no, 'icv', icv_, 'hash', h, 'previous_hash', prev);
end $$;

-- 4. finance confirms a bank transfer for a retail order -------------------
create or replace function public.admin_confirm_transfer(p_order_id text, p_reference text) returns text
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reference), '') = '' then raise exception 'transfer reference required'; end if;
  select * into o from public.orders where id = p_order_id;
  if exists (select 1 from public.deals where order_id = p_order_id) then raise exception 'deal orders are paid by instalments'; end if;
  perform public.post_txn('bank transfer received · ' || p_reference, o.id, jsonb_build_array(
    jsonb_build_object('account', 'asset:bank', 'debit', o.total),
    jsonb_build_object('account', 'asset:gateway_clearing', 'credit', o.total)));
  return public.confirm_payment(p_order_id, 0, 'transfer:' || p_reference);
end $$;

-- 5. e-wallet payout details -------------------------------------------------
alter table public.kyc_private add column if not exists wallet_provider text;
alter table public.kyc_private add column if not exists wallet_number text;

create or replace function public.submit_wallet(p_provider text, p_number text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_provider not in ('jazzcash', 'easypaisa', 'gopay', 'ovo', 'dana', 'vodafone_cash', 'stcpay', 'other') then raise exception 'unsupported wallet'; end if;
  if p_number !~ '^\+?[0-9]{8,15}$' then raise exception 'invalid wallet number'; end if;
  insert into public.kyc_private (user_id, wallet_provider, wallet_number) values (auth.uid(), p_provider, p_number)
  on conflict (user_id) do update set wallet_provider = excluded.wallet_provider, wallet_number = excluded.wallet_number;
  perform public.audit('kyc.wallet', 'kyc_private', auth.uid()::text, jsonb_build_object('provider', p_provider));
end $$;

create or replace function public.request_payout(p_method text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me public.ambassadors; total numeric; minimum numeric; pid bigint; verified boolean; k public.kyc_private;
begin
  select * into me from public.ambassadors where user_id = auth.uid();
  if me.user_id is null or me.status <> 'active' then raise exception 'not an active ambassador'; end if;
  select verification_status = 'verified' into verified from public.profiles where id = auth.uid();
  if not coalesce(verified, false) then raise exception 'identity not verified'; end if;
  if p_method not in ('bank', 'wallet') then raise exception 'bad method'; end if;
  select * into k from public.kyc_private where user_id = auth.uid();
  if p_method = 'bank' and k.iban is null then raise exception 'iban required'; end if;
  if p_method = 'wallet' and k.wallet_number is null then raise exception 'wallet details required'; end if;
  if exists (select 1 from public.payouts where beneficiary_id = auth.uid() and status in ('requested', 'approved')) then
    raise exception 'a payout is already in progress';
  end if;
  select coalesce(sum(amount), 0) into total from public.commissions
   where beneficiary_id = auth.uid() and state = 'eligible' and payout_id is null;
  minimum := coalesce((public.active_settings() -> 'ambassador' ->> 'minPayout')::numeric, 200);
  if total < minimum then raise exception 'below minimum payout (%)', minimum; end if;
  insert into public.payouts (beneficiary_id, amount, method) values (auth.uid(), total, p_method) returning id into pid;
  update public.commissions set payout_id = pid where beneficiary_id = auth.uid() and state = 'eligible' and payout_id is null;
  perform public.audit('payout.request', 'payouts', pid::text, jsonb_build_object('amount', total, 'method', p_method));
  return jsonb_build_object('id', pid, 'amount', total);
end $$;

-- admin sees where to send the money (masked)
create or replace view public.admin_payouts with (security_barrier = true) as
  select p.id, p.amount, p.method, p.status, p.requested_at, pr.full_name as name, pr.country,
         case when p.method = 'bank' then left(k.iban, 4) || ' •••• ' || right(k.iban, 4)
              else k.wallet_provider || ' •••• ' || right(k.wallet_number, 4) end as destination
  from public.payouts p join public.profiles pr on pr.id = p.beneficiary_id
  left join public.kyc_private k on k.user_id = p.beneficiary_id
  where public.is_admin();

grant execute on function public.admin_confirm_transfer(text, text) to authenticated;
grant execute on function public.submit_wallet(text, text) to authenticated;
