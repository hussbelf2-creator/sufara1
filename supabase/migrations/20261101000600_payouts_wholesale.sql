-- ════════════════════════════════════════════════════════════════════════
-- Safeer · 006 — ambassador payouts, wholesale quotes → deal → instalments,
-- and the admin economics view the settlement ledger reads.
-- ════════════════════════════════════════════════════════════════════════

-- ── payouts ─────────────────────────────────────────────────────────────
-- An ambassador withdraws eligible commissions. The amount is computed on
-- the server (never typed), commissions are locked to the payout, and the
-- ledger moves only when an admin marks it sent.
create or replace function public.request_payout(p_method text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me public.ambassadors; total numeric; minimum numeric; pid bigint; verified boolean;
begin
  select * into me from public.ambassadors where user_id = auth.uid();
  if me.user_id is null or me.status <> 'active' then raise exception 'not an active ambassador'; end if;
  select verification_status = 'verified' into verified from public.profiles where id = auth.uid();
  if not coalesce(verified, false) then raise exception 'identity not verified'; end if;
  if not exists (select 1 from public.kyc_private where user_id = auth.uid() and iban is not null) and p_method = 'bank' then
    raise exception 'iban required';
  end if;
  if p_method not in ('bank', 'wallet', 'store_credit') then raise exception 'bad method'; end if;
  if exists (select 1 from public.payouts where beneficiary_id = auth.uid() and status in ('requested', 'approved')) then
    raise exception 'a payout is already in progress';
  end if;

  select coalesce(sum(amount), 0) into total from public.commissions
   where beneficiary_id = auth.uid() and state = 'eligible' and payout_id is null;
  minimum := coalesce((public.active_settings() -> 'ambassador' ->> 'minPayout')::numeric, 200);
  if total < minimum then raise exception 'below minimum payout (%)', minimum; end if;

  insert into public.payouts (beneficiary_id, amount, method) values (auth.uid(), total, p_method) returning id into pid;
  update public.commissions set payout_id = pid
   where beneficiary_id = auth.uid() and state = 'eligible' and payout_id is null;
  perform public.audit('payout.request', 'payouts', pid::text, jsonb_build_object('amount', total, 'method', p_method));
  return jsonb_build_object('id', pid, 'amount', total);
end $$;

create or replace function public.admin_decide_payout(p_id bigint, p_decision text) returns void
language plpgsql security definer set search_path = public as $$
declare p public.payouts;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into p from public.payouts where id = p_id for update;
  if p.id is null then raise exception 'unknown payout'; end if;
  if p_decision = 'approved' and p.status = 'requested' then
    update public.payouts set status = 'approved', decided_by = auth.uid(), decided_at = now() where id = p_id;
  elsif p_decision = 'sent' and p.status = 'approved' then
    update public.payouts set status = 'sent', decided_by = auth.uid(), decided_at = now() where id = p_id;
    update public.commissions set state = 'paid' where payout_id = p_id;
    perform public.post_txn('ambassador payout ' || p_id, null, jsonb_build_array(
      jsonb_build_object('account', 'liability:ambassador_payable', 'debit', p.amount),
      jsonb_build_object('account', 'asset:bank', 'credit', p.amount)));
  elsif p_decision = 'rejected' and p.status in ('requested', 'approved') then
    update public.payouts set status = 'rejected', decided_by = auth.uid(), decided_at = now() where id = p_id;
    update public.commissions set payout_id = null where payout_id = p_id;   -- back to the wallet
  else
    raise exception 'cannot % a % payout', p_decision, p.status;
  end if;
  perform public.audit('payout.' || p_decision, 'payouts', p_id::text, jsonb_build_object('amount', p.amount));
end $$;

-- Wallet summary for the signed-in ambassador.
create or replace function public.my_wallet() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'pending', coalesce(sum(amount) filter (where state = 'pending'), 0),
    'eligible', coalesce(sum(amount) filter (where state = 'eligible' and payout_id is null), 0),
    'in_payout', coalesce(sum(amount) filter (where state = 'eligible' and payout_id is not null), 0),
    'paid', coalesce(sum(amount) filter (where state = 'paid'), 0),
    'min_payout', coalesce((public.active_settings() -> 'ambassador' ->> 'minPayout')::numeric, 200)
  ) from public.commissions where beneficiary_id = auth.uid();
$$;

-- ── wholesale: factory quotes, buyer accepts, deal with instalments ─────
create or replace function public.submit_quote(p_rfq uuid, p_factory text, p_unit numeric, p_lead int, p_terms text, p_valid date)
returns uuid language plpgsql security definer set search_path = public as $$
declare r public.rfqs; qid uuid;
begin
  if not public.owns_factory(p_factory) then raise exception 'forbidden'; end if;
  select * into r from public.rfqs where id = p_rfq;
  if r.id is null or r.status not in ('open', 'quoted') then raise exception 'rfq closed'; end if;
  if p_unit <= 0 or p_lead <= 0 or p_valid < current_date then raise exception 'invalid quote'; end if;
  insert into public.quotes (rfq_id, factory_id, unit_price, lead_days, terms, valid_until)
  values (p_rfq, p_factory, p_unit, p_lead, coalesce(p_terms, ''), p_valid)
  on conflict (rfq_id, factory_id) do update
    set unit_price = excluded.unit_price, lead_days = excluded.lead_days, terms = excluded.terms,
        valid_until = excluded.valid_until, status = 'submitted', created_at = now()
  returning id into qid;
  update public.rfqs set status = 'quoted' where id = p_rfq and status = 'open';
  perform public.audit('quote.submit', 'quotes', qid::text, jsonb_build_object('rfq', p_rfq, 'unit', p_unit));
  return qid;
end $$;

-- p_plan: array of {days, share} — e.g. 30% now, 70% before dispatch.
create or replace function public.accept_quote(p_quote uuid, p_plan jsonb default '[{"days":0,"share":0.3},{"days":30,"share":0.7}]')
returns uuid language plpgsql security definer set search_path = public as $$
declare q public.quotes; r public.rfqs; d uuid; total numeric; s numeric := 0; i int := 0; step jsonb; amt numeric; allocated numeric := 0; n int;
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
  insert into public.deals (quote_id, total) values (q.id, total) returning id into d;
  for step in select * from jsonb_array_elements(p_plan) loop
    i := i + 1;
    amt := case when i = n then total - allocated else round(total * (step ->> 'share')::numeric, 2) end;
    allocated := allocated + amt;
    insert into public.deal_installments (deal_id, seq, due_on, share, amount)
    values (d, i, current_date + coalesce((step ->> 'days')::int, 0), (step ->> 'share')::numeric, amt);
  end loop;
  update public.quotes set status = case when id = q.id then 'accepted' else 'rejected' end where rfq_id = r.id;
  update public.rfqs set status = 'awarded' where id = r.id;
  perform public.audit('deal.create', 'deals', d::text, jsonb_build_object('quote', q.id, 'total', total));
  return d;
end $$;

-- ── admin economics: one row per paid sub-order, in LedgerOrder shape ───
create or replace view public.admin_order_economics with (security_barrier = true) as
  select s.id, to_char(o.paid_at, 'YYYY-MM-DD') as date, o.buyer_name as buyer, o.country,
         s.goods as gross, case when s.new_customer then 'new' else 'repeat' end as segment,
         coalesce(a.code, '') as ambassador, o.status::text as status,
         case when o.status in ('refunded', 'cancelled') then 'danger' when s.settled then 'ok' else 'warn' end as tone,
         o.channel, s.discount, a.tier as "ambassadorTier",
         (select l.code from public.ambassadors l where l.user_id = a.leader_id) as leader
  from public.sub_orders s
  join public.orders o on o.id = s.order_id
  left join public.ambassadors a on a.user_id = o.ambassador_id
  where o.paid_at is not null and public.is_admin();

create or replace view public.admin_payouts with (security_barrier = true) as
  select p.id, p.amount, p.method, p.status, p.requested_at, pr.full_name as name, pr.country
  from public.payouts p join public.profiles pr on pr.id = p.beneficiary_id
  where public.is_admin();

grant select on public.admin_order_economics, public.admin_payouts to authenticated;
grant execute on function public.request_payout(text) to authenticated;
grant execute on function public.admin_decide_payout(bigint, text) to authenticated;
grant execute on function public.my_wallet() to authenticated;
grant execute on function public.submit_quote(uuid, text, numeric, int, text, date) to authenticated;
grant execute on function public.accept_quote(uuid, jsonb) to authenticated;
