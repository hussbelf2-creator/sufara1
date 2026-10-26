-- Migration 012
--  • Legal: versioned documents, an acceptance record per account (at sign-up,
--    on a new version, and the versions a guest accepted with each order).
--  • PDPL: data-subject requests (access / correction / deletion) with a
--    30-day deadline, an instant export of one's own data, and anonymisation
--    that keeps what tax law requires.
--  • Monitoring: job runs, webhook log (also used to drop duplicates), client
--    errors, integrity checks, and a health sweep that alerts on change.

-- ── legal documents and acceptances ────────────────────────────────────
create table if not exists public.legal_documents (
  key text not null check (key in ('terms', 'privacy', 'returns', 'ambassador', 'factory')),
  version text not null,
  effective_from date not null,
  required_for app_role[] not null default '{}',
  primary key (key, version)
);
alter table public.legal_documents enable row level security;
drop policy if exists legal_read on public.legal_documents;
create policy legal_read on public.legal_documents for select using (true);
drop policy if exists legal_admin on public.legal_documents;
create policy legal_admin on public.legal_documents for all using (public.is_admin()) with check (public.is_admin());

-- Keep in step with src/config/legal.ts (a vitest test compares them).
insert into public.legal_documents (key, version, effective_from, required_for) values
  ('terms', '2026-10', '2026-10-25', '{buyer,ambassador,factory,admin}'),
  ('privacy', '2026-10', '2026-10-25', '{buyer,ambassador,factory,admin}'),
  ('returns', '2026-10', '2026-10-25', '{}'),
  ('ambassador', '2026-10', '2026-10-25', '{ambassador}'),
  ('factory', '2026-10', '2026-10-25', '{factory}')
on conflict do nothing;

create table if not exists public.legal_acceptances (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  doc_key text not null,
  version text not null,
  channel text not null check (channel in ('signup', 'dashboard', 'checkout')),
  user_agent text,
  accepted_at timestamptz not null default now(),
  foreign key (doc_key, version) references public.legal_documents (key, version),
  unique (user_id, doc_key, version)
);
alter table public.legal_acceptances enable row level security;
drop policy if exists la_read on public.legal_acceptances;
create policy la_read on public.legal_acceptances for select using (user_id = auth.uid() or public.is_admin());

create or replace function public.current_legal_version(p_key text) returns text
language sql stable set search_path = public as $$
  select version from public.legal_documents
  where key = p_key and effective_from <= current_date order by effective_from desc, version desc limit 1;
$$;

/* Documents the caller still has to accept for the panels they hold. */
create or replace function public.my_pending_legal() returns table (key text, version text, effective_from date)
language sql stable security definer set search_path = public as $$
  select d.key, d.version, d.effective_from
  from public.legal_documents d
  where d.version = public.current_legal_version(d.key)
    and exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = any(d.required_for))
    and not exists (select 1 from public.legal_acceptances a
                    where a.user_id = auth.uid() and a.doc_key = d.key and a.version = d.version)
  order by d.key;
$$;

create or replace function public.accept_legal(p_keys text[], p_user_agent text default null) returns int
language plpgsql security definer set search_path = public as $$
declare k text; v text; n int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  foreach k in array coalesce(p_keys, '{}') loop
    v := public.current_legal_version(k);
    if v is null then raise exception 'unknown document %', k; end if;
    insert into public.legal_acceptances (user_id, doc_key, version, channel, user_agent)
    values (auth.uid(), k, v, 'dashboard', left(p_user_agent, 300)) on conflict do nothing;
  end loop;
  select count(*) into n from public.my_pending_legal();
  return n;
end $$;

/* Sign-up: the register form sends the versions shown to the user. Only
   versions that exist are recorded; anything else is ignored. */
create or replace function public.record_signup_legal() returns trigger
language plpgsql security definer set search_path = public as $$
declare item text;
begin
  if jsonb_typeof(new.raw_user_meta_data -> 'legal_accepted') <> 'array' then return new; end if;
  for item in select jsonb_array_elements_text(new.raw_user_meta_data -> 'legal_accepted') loop
    insert into public.legal_acceptances (user_id, doc_key, version, channel)
    select new.id, d.key, d.version, 'signup' from public.legal_documents d
    where d.key = split_part(item, '@', 1) and d.version = split_part(item, '@', 2)
    on conflict do nothing;
  end loop;
  return new;
end $$;
drop trigger if exists on_auth_user_legal on auth.users;
create trigger on_auth_user_legal after insert on auth.users
  for each row execute function public.record_signup_legal();

-- Guests accept the terms by placing the order; the order keeps the versions.
alter table public.orders add column if not exists terms_version text;
alter table public.orders add column if not exists privacy_version text;

-- ── PDPL data-subject requests ─────────────────────────────────────────
create table if not exists public.data_requests (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('access', 'correction', 'deletion')),
  details text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'rejected')),
  due_at timestamptz not null default now() + interval '30 days',
  resolution text,
  resolved_by uuid references auth.users (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.data_requests enable row level security;
drop policy if exists dr_read on public.data_requests;
create policy dr_read on public.data_requests for select using (user_id = auth.uid() or public.is_admin());

create or replace function public.request_data_action(p_kind text, p_details text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare rid bigint;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from public.data_requests where user_id = auth.uid() and kind = p_kind and status in ('open', 'in_progress')) then
    raise exception 'a request of this kind is already open';
  end if;
  insert into public.data_requests (user_id, kind, details) values (auth.uid(), p_kind, left(p_details, 2000)) returning id into rid;
  perform public.notify_admins('privacy.request', 'طلب خصوصية جديد',
    case p_kind when 'deletion' then 'طلب حذف حساب' when 'correction' then 'طلب تصحيح بيانات' else 'طلب نسخة من البيانات' end
      || ' — المهلة النظامية ٣٠ يومًا', '/dashboard?mode=admin&view=admin-privacy', jsonb_build_object('request', rid));
  perform public.audit('privacy.request', 'data_requests', rid::text, jsonb_build_object('kind', p_kind));
  return rid;
end $$;

/* Everything the platform holds about the caller, as one JSON document. */
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); out jsonb;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  out := jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = uid),
    'roles', (select coalesce(jsonb_agg(r.role), '[]') from public.user_roles r where r.user_id = uid),
    'payout_details', (select jsonb_build_object(
        'iban', case when k.iban is null then null else '****' || right(k.iban, 4) end,
        'wallet_provider', k.wallet_provider, 'submitted_at', k.submitted_at)
      from public.kyc_private k where k.user_id = uid),
    'orders', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id, 'created_at', o.created_at, 'status', o.status, 'total', o.total, 'country', o.country,
        'city', o.city, 'address', o.address, 'phone', o.buyer_phone, 'invoice_no', o.invoice_no,
        'items', (select coalesce(jsonb_agg(jsonb_build_object('product', i.product_id, 'qty', i.qty, 'unit_price', i.unit_price)), '[]')
                  from public.order_items i join public.sub_orders s on s.id = i.sub_order_id where s.order_id = o.id))
        order by o.created_at), '[]') from public.orders o where o.buyer_user_id = uid),
    'ambassador', (select to_jsonb(a) from public.ambassadors a where a.user_id = uid),
    'commissions', (select coalesce(jsonb_agg(jsonb_build_object('amount', c.amount, 'state', c.state, 'created_at', c.created_at)), '[]')
                    from public.commissions c where c.beneficiary_id = uid),
    'notifications', (select coalesce(jsonb_agg(jsonb_build_object('title', n.title, 'body', n.body, 'created_at', n.created_at)), '[]')
                      from public.notifications n where n.user_id = uid),
    'legal_acceptances', (select coalesce(jsonb_agg(jsonb_build_object('document', l.doc_key, 'version', l.version, 'accepted_at', l.accepted_at, 'channel', l.channel)), '[]')
                          from public.legal_acceptances l where l.user_id = uid),
    'data_requests', (select coalesce(jsonb_agg(jsonb_build_object('kind', d.kind, 'status', d.status, 'created_at', d.created_at)), '[]')
                      from public.data_requests d where d.user_id = uid));
  perform public.audit('privacy.export', 'profiles', uid::text, '{}'::jsonb);
  return out;
end $$;

/* Deletion: personal data is removed or anonymised; orders, invoices and
   ledger entries stay (tax law), detached from the person's contact data.
   The auth account itself is deleted by the backend with the admin API. */
create or replace function public.anonymize_user(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then raise exception 'forbidden'; end if;
  if exists (select 1 from public.orders o where o.buyer_user_id = p_user and o.status in ('pending_payment', 'paid', 'dispatched')) then
    raise exception 'open orders must finish first';
  end if;
  if exists (select 1 from public.commissions c where c.beneficiary_id = p_user and c.state in ('pending', 'eligible')) then
    raise exception 'pending or unpaid commission must be settled first';
  end if;
  update public.profiles set full_name = 'محذوف', company = '', phone = null, city = null, website = null,
    job_title = null, whatsapp_opt_in = false, verification_ref = null
  where id = p_user;
  delete from public.kyc_private where user_id = p_user;
  delete from public.notifications where user_id = p_user;
  update public.orders set buyer_phone = null, address = null, whatsapp_opt_in = false where buyer_user_id = p_user;
  update public.ambassadors set status = 'suspended' where user_id = p_user;
  delete from public.user_roles where user_id = p_user and role <> 'buyer';
  perform public.audit('privacy.anonymize', 'profiles', p_user::text, '{}'::jsonb);
end $$;

create or replace function public.admin_resolve_data_request(p_id bigint, p_status text, p_resolution text) returns void
language plpgsql security definer set search_path = public as $$
declare r public.data_requests;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('in_progress', 'done', 'rejected') then raise exception 'bad status'; end if;
  if p_status = 'rejected' and coalesce(trim(p_resolution), '') = '' then raise exception 'a rejection needs a reason'; end if;
  select * into r from public.data_requests where id = p_id for update;
  if r.id is null then raise exception 'unknown request'; end if;
  if p_status = 'done' and r.kind = 'deletion' and r.user_id is not null then
    perform public.anonymize_user(r.user_id);
  end if;
  update public.data_requests set status = p_status, resolution = p_resolution,
    resolved_by = case when p_status in ('done', 'rejected') then auth.uid() end,
    resolved_at = case when p_status in ('done', 'rejected') then now() end
  where id = p_id;
  if r.user_id is not null and p_status in ('done', 'rejected') and r.kind <> 'deletion' then
    perform public.notify(r.user_id, 'privacy.resolved', 'تم الرد على طلب الخصوصية', coalesce(p_resolution, ''),
                          '/dashboard?mode=buyer&view=account');
  end if;
  perform public.audit('privacy.resolve', 'data_requests', p_id::text, jsonb_build_object('status', p_status));
end $$;

grant execute on function public.my_pending_legal() to authenticated;
grant execute on function public.accept_legal(text[], text) to authenticated;
grant execute on function public.request_data_action(text, text) to authenticated;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.admin_resolve_data_request(bigint, text, text) to authenticated;
revoke execute on function public.anonymize_user(uuid) from public, anon;
grant execute on function public.anonymize_user(uuid) to authenticated, service_role;

create or replace view public.admin_data_requests with (security_barrier = true) as
  select d.*, p.email, p.full_name, (d.due_at < now() and d.status in ('open', 'in_progress')) as overdue
  from public.data_requests d left join public.profiles p on p.id = d.user_id
  where public.is_admin();
grant select on public.admin_data_requests to authenticated;

-- ── monitoring: job runs, webhooks, client errors ──────────────────────
create table if not exists public.job_runs (
  id bigint generated always as identity primary key,
  job text not null,
  status text not null check (status in ('ok', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now(),
  details jsonb not null default '{}',
  error text
);
create index if not exists job_runs_job_idx on public.job_runs (job, finished_at desc);
alter table public.job_runs enable row level security;
drop policy if exists jr_admin on public.job_runs;
create policy jr_admin on public.job_runs for select using (public.is_admin());

create or replace function public.record_job(p_job text, p_status text, p_details jsonb default '{}'::jsonb,
                                             p_error text default null, p_started timestamptz default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin')) then raise exception 'forbidden'; end if;
  insert into public.job_runs (job, status, started_at, details, error)
  values (p_job, p_status, coalesce(p_started, now()), coalesce(p_details, '{}'), left(p_error, 2000));
end $$;

create table if not exists public.webhook_events (
  id bigint generated always as identity primary key,
  source text not null,
  event_id text,
  status text not null check (status in ('ok', 'failed', 'duplicate', 'rejected')),
  http_status int,
  error text,
  received_at timestamptz not null default now()
);
create index if not exists webhook_events_recent_idx on public.webhook_events (received_at desc);
create unique index if not exists webhook_events_once on public.webhook_events (source, event_id) where status = 'ok' and event_id is not null;
alter table public.webhook_events enable row level security;
drop policy if exists we_admin on public.webhook_events;
create policy we_admin on public.webhook_events for select using (public.is_admin());

create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  fingerprint text not null,
  message text not null,
  stack text,
  url text,
  release text,
  user_agent text,
  user_id uuid,
  occurrences int not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create unique index if not exists client_errors_fp on public.client_errors (fingerprint, release);
alter table public.client_errors enable row level security;
drop policy if exists ce_admin on public.client_errors;
create policy ce_admin on public.client_errors for select using (public.is_admin());

/* Called by the browser (anon or signed in). Same error + release is
   counted on one row; a row stops counting at 10,000 to cap abuse. */
create or replace function public.log_client_error(p_message text, p_stack text default null, p_url text default null,
                                                   p_release text default null, p_user_agent text default null) returns void
language plpgsql security definer set search_path = public as $$
declare fp text := encode(digest(left(coalesce(p_message, ''), 300) || '|' || left(coalesce(p_stack, ''), 300), 'sha256'), 'hex');
begin
  if coalesce(trim(p_message), '') = '' then return; end if;
  insert into public.client_errors (fingerprint, message, stack, url, release, user_agent, user_id)
  values (fp, left(p_message, 500), left(p_stack, 4000), left(p_url, 500), left(coalesce(p_release, 'dev'), 40), left(p_user_agent, 300), auth.uid())
  on conflict (fingerprint, release) do update
    set occurrences = least(public.client_errors.occurrences + 1, 10000), last_seen = now(), url = excluded.url;
end $$;
grant execute on function public.log_client_error(text, text, text, text, text) to anon, authenticated;

-- ── health ─────────────────────────────────────────────────────────────
/* Invoice chain: each invoice must point at the previous hash and its own
   hash must match its payload (detects edits and gaps, also after a restore). */
create or replace function public.invoice_chain_breaks() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from (
    select i.icv, i.hash, i.previous_hash, i.payload,
           lag(i.hash) over (order by i.icv) as prev_hash
    from public.invoices i
  ) x
  where x.previous_hash <> coalesce(x.prev_hash, encode(digest('0', 'sha256'), 'hex'))
     or x.hash <> encode(digest(x.payload::text || '|' || x.previous_hash, 'sha256'), 'hex');
$$;

create or replace function public.system_health() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  checks jsonb := '[]';
  last_nightly timestamptz; nightly_failed boolean; last_dispatch timestamptz; last_backup timestamptz; last_drill timestamptz;
  wh_failed int; backlog int; errors_1h int; stuck int; late_handover int; ledger numeric; chain int; overdue_privacy int;
  add jsonb;
begin
  if not (public.is_admin() or auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin')) then
    raise exception 'forbidden';
  end if;
  select max(finished_at) filter (where status = 'ok'), bool_or(status = 'failed' and finished_at > now() - interval '26 hours')
    into last_nightly, nightly_failed from public.job_runs where job = 'nightly';
  select max(finished_at) into last_dispatch from public.job_runs where job = 'notify_dispatch' and status = 'ok';
  select max(finished_at) into last_backup from public.job_runs where job = 'backup' and status = 'ok';
  select max(finished_at) into last_drill from public.job_runs where job = 'restore_drill' and status = 'ok';
  select count(*) into wh_failed from public.webhook_events where status in ('failed', 'rejected') and received_at > now() - interval '24 hours';
  select count(*) into backlog from public.notifications where emailed_at is null and created_at < now() - interval '30 minutes'
    and created_at > now() - interval '3 days';
  select coalesce(sum(occurrences), 0) into errors_1h from public.client_errors where last_seen > now() - interval '1 hour';
  select count(*) into stuck from public.orders where status = 'pending_payment' and created_at < now() - interval '48 hours';
  select count(*) into late_handover from public.sub_orders s join public.orders o on o.id = s.order_id
    where s.status = 'paid' and s.handover_at is null and o.paid_at < now() - interval '5 days';
  select coalesce(sum(debit) - sum(credit), 0) into ledger from public.ledger_entries;
  chain := public.invoice_chain_breaks();
  select count(*) into overdue_privacy from public.data_requests where status in ('open', 'in_progress') and due_at < now();

  checks := jsonb_build_array(
    jsonb_build_object('key', 'nightly', 'status',
      case when last_nightly > now() - interval '26 hours' and not coalesce(nightly_failed, false) then 'ok' else 'fail' end,
      'value', last_nightly),
    jsonb_build_object('key', 'notify_dispatch', 'status',
      case when last_dispatch > now() - interval '30 minutes' then 'ok' when last_dispatch > now() - interval '2 hours' then 'warn' else 'fail' end,
      'value', last_dispatch),
    jsonb_build_object('key', 'backup', 'status', case when last_backup > now() - interval '26 hours' then 'ok' else 'fail' end, 'value', last_backup),
    jsonb_build_object('key', 'restore_drill', 'status', case when last_drill > now() - interval '35 days' then 'ok' else 'warn' end, 'value', last_drill),
    jsonb_build_object('key', 'webhooks', 'status', case when wh_failed = 0 then 'ok' when wh_failed < 5 then 'warn' else 'fail' end, 'value', wh_failed),
    jsonb_build_object('key', 'email_backlog', 'status', case when backlog = 0 then 'ok' when backlog < 50 then 'warn' else 'fail' end, 'value', backlog),
    jsonb_build_object('key', 'client_errors', 'status', case when errors_1h < 20 then 'ok' when errors_1h < 100 then 'warn' else 'fail' end, 'value', errors_1h),
    jsonb_build_object('key', 'stuck_payments', 'status', case when stuck = 0 then 'ok' else 'warn' end, 'value', stuck),
    jsonb_build_object('key', 'late_handover', 'status', case when late_handover = 0 then 'ok' else 'warn' end, 'value', late_handover),
    jsonb_build_object('key', 'ledger_balance', 'status', case when ledger = 0 then 'ok' else 'fail' end, 'value', ledger),
    jsonb_build_object('key', 'invoice_chain', 'status', case when chain = 0 then 'ok' else 'fail' end, 'value', chain),
    jsonb_build_object('key', 'privacy_deadlines', 'status', case when overdue_privacy = 0 then 'ok' else 'fail' end, 'value', overdue_privacy));
  return jsonb_build_object(
    'checked_at', now(),
    'overall', case when checks @> '[{"status":"fail"}]' then 'fail' when checks @> '[{"status":"warn"}]' then 'warn' else 'ok' end,
    'checks', checks);
end $$;
grant execute on function public.system_health() to authenticated, service_role;

create table if not exists public.health_state (
  key text primary key,
  status text not null,
  since timestamptz not null default now()
);
alter table public.health_state enable row level security;
drop policy if exists hs_admin on public.health_state;
create policy hs_admin on public.health_state for select using (public.is_admin());

/* Compares the checks with the last known state and alerts admins only on a
   change (newly failing, or recovered), so an outage is one alert, not 96. */
create or replace function public.health_sweep() returns jsonb
language plpgsql security definer set search_path = public as $$
declare h jsonb; c jsonb; prev text; changed jsonb := '[]';
begin
  if not (auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin')) then raise exception 'forbidden'; end if;
  h := public.system_health();
  for c in select * from jsonb_array_elements(h -> 'checks') loop
    select status into prev from public.health_state where key = c ->> 'key';
    if prev is distinct from c ->> 'status' then
      insert into public.health_state (key, status, since) values (c ->> 'key', c ->> 'status', now())
      on conflict (key) do update set status = excluded.status, since = now();
      if c ->> 'status' <> 'ok' or prev is not null then
        changed := changed || jsonb_build_array(jsonb_build_object('key', c ->> 'key', 'from', prev, 'to', c ->> 'status', 'value', c -> 'value'));
        if c ->> 'status' <> 'ok' or prev <> 'ok' then
          perform public.notify_admins('health.' || (c ->> 'key'),
            case when c ->> 'status' = 'ok' then 'عاد للعمل: ' else 'تنبيه تشغيل: ' end || (c ->> 'key'),
            'الحالة: ' || (c ->> 'status') || ' · القيمة: ' || coalesce(c ->> 'value', '—'),
            '/dashboard?mode=admin&view=admin-health', c);
        end if;
      end if;
    end if;
  end loop;
  insert into public.job_runs (job, status, details) values ('health_sweep', 'ok', jsonb_build_object('overall', h ->> 'overall', 'changed', changed));
  return jsonb_build_object('overall', h ->> 'overall', 'changed', changed);
end $$;
revoke execute on function public.health_sweep() from public, anon, authenticated;
revoke execute on function public.record_job(text, text, jsonb, text, timestamptz) from public, anon, authenticated;
grant execute on function public.health_sweep() to service_role;
grant execute on function public.record_job(text, text, jsonb, text, timestamptz) to service_role;

-- ── hardening found by the generated API catalog ───────────────────────
-- These were executable by PUBLIC (PostgreSQL's default for new functions):
-- anyone could write forged audit entries or trigger KYB recomputation.
-- They are internal: called only from other definer functions, triggers,
-- the service role or the SQL editor.
revoke execute on function public.audit(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.recompute_factory_kyb(text) from public, anon, authenticated;
revoke execute on function public.invoice_chain_breaks() from public, anon, authenticated;
grant execute on function public.audit(text, text, text, jsonb) to service_role;
grant execute on function public.recompute_factory_kyb(text) to service_role;
grant execute on function public.invoice_chain_breaks() to service_role;
