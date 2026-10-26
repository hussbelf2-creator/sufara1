-- ════════════════════════════════════════════════════════════════════════
-- Safeer · 001 — identity, roles, KYC, audit, platform settings, CMS
--
-- Principles (audit §4):
--   • The browser never decides a role or a verification status.
--   • Sensitive identity data (national ID, IBAN) lives in its own table,
--     never in user_metadata / the JWT.
--   • Every admin decision is written to an append-only audit log.
--   • Every table has RLS on; there is no table a client can write freely.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── roles ────────────────────────────────────────────────────────────────
do $$ begin
  create type app_role as enum ('buyer', 'ambassador', 'factory', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_state as enum ('unverified', 'pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  company text not null default '',
  requested_panel app_role not null default 'buyer',
  verification_status verification_state not null default 'unverified',
  verification_method text,
  verification_ref text,
  phone text, country text, city text, entity_type text, job_title text,
  cr_number text, vat_number text, industry text, website text, categories text,
  monthly_volume text, employees text, factory_area text, annual_capacity text,
  promo_channel text, audience_size text, experience text, payout_method text,
  acquisition_channel text,
  leader_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Older installs may still carry the client-written columns; drop the
-- sensitive ones so they cannot be read through profiles any more.
alter table public.profiles drop column if exists iban;
alter table public.profiles drop column if exists national_id;
alter table public.profiles drop column if exists panel;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role app_role not null,
  granted_by uuid references auth.users (id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.kyc_private (
  user_id uuid primary key references auth.users (id) on delete cascade,
  national_id text,
  iban text,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id, action, created_at desc);

-- Append-only: no role (not even service_role through PostgREST) may rewrite history.
create or replace function public.forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name;
end $$;

drop trigger if exists audit_log_append_only on public.audit_log;
create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function public.forbid_mutation();

-- ── platform settings table (needed by is_admin) ─────────────────────
create table if not exists public.platform_settings (
  version int primary key,
  effective_from date not null,
  note text not null,
  payload jsonb not null,
  created_by text not null default '',
  created_by_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

drop trigger if exists platform_settings_append_only on public.platform_settings;
create trigger platform_settings_append_only before update or delete on public.platform_settings
  for each row execute function public.forbid_mutation();

-- ── helpers ──────────────────────────────────────────────────────────────
create or replace function public.has_role(p_role app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = p_role);
$$;

-- Admin with the second factor when the platform requires it.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role('admin')
     and (
       coalesce((select (payload -> 'security' ->> 'requireMfaForAdmin')::boolean
                 from public.platform_settings
                 where effective_from <= current_date
                 order by effective_from desc, version desc limit 1), true) = false
       or coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     );
$$;

create or replace function public.audit(p_action text, p_entity text, p_entity_id text, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;

-- ── sign-up trigger: whitelisted metadata only, role = buyer ─────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested app_role := case m ->> 'requested_panel'
    when 'ambassador' then 'ambassador'::app_role
    when 'factory' then 'factory'::app_role
    else 'buyer'::app_role end;           -- 'admin' is never accepted here
  leader uuid;
begin
  -- Invite link of a leader ambassador: attach to that leader (one level).
  -- (ambassadors is created in the next migration; resolved at run time.)
  if m ? 'leader_code' then
    select a.user_id into leader from public.ambassadors a
     where a.code = upper(m ->> 'leader_code') and a.is_leader and a.status = 'active';
  end if;

  insert into public.profiles (
    id, email, full_name, company, requested_panel, verification_status, verification_method,
    phone, country, city, entity_type, job_title, cr_number, vat_number, industry, website, categories,
    monthly_volume, employees, factory_area, annual_capacity, promo_channel, audience_size, experience,
    payout_method, acquisition_channel, leader_id
  ) values (
    new.id, coalesce(new.email, ''), left(coalesce(m ->> 'full_name', ''), 120), left(coalesce(m ->> 'company', ''), 160),
    requested,
    case when requested = 'buyer' then 'unverified'::verification_state else 'pending'::verification_state end,
    left(m ->> 'verification_method', 20),
    left(m ->> 'phone', 40), left(m ->> 'country', 8), left(m ->> 'city', 80), left(m ->> 'entity_type', 40),
    left(m ->> 'job_title', 80), left(m ->> 'cr_number', 20), left(m ->> 'vat_number', 20), left(m ->> 'industry', 60),
    left(m ->> 'website', 200), left(m ->> 'categories', 200), left(m ->> 'monthly_volume', 40), left(m ->> 'employees', 40),
    left(m ->> 'factory_area', 40), left(m ->> 'annual_capacity', 60), left(m ->> 'promo_channel', 60),
    left(m ->> 'audience_size', 40), left(m ->> 'experience', 40), left(m ->> 'payout_method', 40),
    left(m ->> 'acquisition_channel', 40), leader
  ) on conflict (id) do nothing;


  -- Everyone can buy. Ambassador / factory panels are granted on approval.
  insert into public.user_roles (user_id, role) values (new.id, 'buyer') on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own descriptive fields, never status / panel / leader.
-- security invoker on purpose: current_user is the caller's role.
create or replace function public.guard_profile_update() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Only admins, the service role and database owners (migrations, SQL editor)
  -- may change these columns.
  if not (public.is_admin() or auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin')) then
    new.verification_status := old.verification_status;
    new.verification_method := old.verification_method;
    new.verification_ref := old.verification_ref;
    new.requested_panel := old.requested_panel;
    new.leader_id := old.leader_id;
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ── RPCs used by the app ────────────────────────────────────────────────
create or replace function public.my_access() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'roles', coalesce((select jsonb_agg(role) from public.user_roles where user_id = auth.uid()), '[]'::jsonb),
    'verification_status', coalesce((select verification_status::text from public.profiles where id = auth.uid()), 'unverified')
  );
$$;

create or replace function public.submit_kyc(p_national_id text, p_iban text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_iban is not null and p_iban !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$' then raise exception 'invalid iban'; end if;
  if p_national_id is not null and p_national_id !~ '^[0-9A-Z]{6,20}$' then raise exception 'invalid id'; end if;
  insert into public.kyc_private (user_id, national_id, iban)
  values (auth.uid(), p_national_id, p_iban)
  on conflict (user_id) do update
    set national_id = coalesce(excluded.national_id, kyc_private.national_id),
        iban = coalesce(excluded.iban, kyc_private.iban),
        submitted_at = now(), reviewed_by = null, reviewed_at = null;
  update public.profiles set verification_status = 'pending' where id = auth.uid() and verification_status <> 'verified';
  perform public.audit('kyc.submit', 'kyc_private', auth.uid()::text, '{}'::jsonb);
end $$;

create or replace function public.admin_set_verification(p_user_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare
  wanted app_role;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('verified', 'rejected', 'pending') then raise exception 'bad status'; end if;
  update public.profiles set verification_status = p_status::verification_state where id = p_user_id
    returning requested_panel into wanted;
  if wanted is null then raise exception 'unknown user'; end if;
  if p_status = 'verified' and wanted in ('ambassador', 'factory') then
    insert into public.user_roles (user_id, role, granted_by) values (p_user_id, wanted, auth.uid()) on conflict do nothing;
  elsif p_status = 'rejected' then
    delete from public.user_roles where user_id = p_user_id and role in ('ambassador', 'factory');
  end if;
  update public.kyc_private set reviewed_by = auth.uid(), reviewed_at = now() where user_id = p_user_id;
  perform public.audit('account.verification', 'profiles', p_user_id::text, jsonb_build_object('status', p_status, 'role', wanted));
end $$;

-- Granting / revoking admin is itself an admin action and is audited.
create or replace function public.admin_set_role(p_user_id uuid, p_role app_role, p_grant boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_user_id = auth.uid() and p_role = 'admin' and not p_grant then raise exception 'cannot remove own admin role'; end if;
  if p_grant then
    insert into public.user_roles (user_id, role, granted_by) values (p_user_id, p_role, auth.uid()) on conflict do nothing;
  else
    delete from public.user_roles where user_id = p_user_id and role = p_role;
  end if;
  perform public.audit(case when p_grant then 'role.grant' else 'role.revoke' end, 'user_roles', p_user_id::text, jsonb_build_object('role', p_role));
end $$;

-- Admin dossier: masked identifiers, admins only.
create or replace view public.admin_accounts with (security_barrier = true) as
  select p.id, p.email, p.full_name, p.company, p.requested_panel::text as panel,
         p.verification_status::text as verification_status, p.verification_method, p.verification_ref,
         p.phone, p.country, p.city, p.entity_type, p.job_title, p.cr_number, p.vat_number, p.industry,
         p.website, p.categories, p.monthly_volume, p.employees, p.factory_area, p.annual_capacity,
         p.promo_channel, p.audience_size, p.experience, p.payout_method, p.acquisition_channel,
         case when k.national_id is null then null else '••••' || right(k.national_id, 4) end as national_id,
         case when k.iban is null then null else left(k.iban, 4) || ' •••• ' || right(k.iban, 4) end as iban,
         p.created_at, p.updated_at
  from public.profiles p
  left join public.kyc_private k on k.user_id = p.id
  where public.is_admin();

-- ── platform settings (versioned, effective-dated) ──────────────────────
-- Server-side guardrails mirror configProblems() in src/config/platform.ts.
create or replace function public.publish_platform_settings(p_payload jsonb, p_effective_from date, p_note text)
returns int language plpgsql security definer set search_path = public as $$
declare
  next_version int;
  take_r numeric := (p_payload -> 'take' -> 'retail' ->> 'value')::numeric;
  take_w numeric := (p_payload -> 'take' -> 'wholesale' ->> 'value')::numeric;
  cap numeric := (p_payload -> 'promo' ->> 'capRate')::numeric;
  leader numeric := (p_payload -> 'ambassador' ->> 'leaderBonus')::numeric;
  amb_w numeric := (p_payload -> 'ambassador' -> 'wholesale' ->> 'value')::numeric;
  top_tier numeric := (select max((t ->> 'rate')::numeric) from jsonb_array_elements(p_payload -> 'ambassador' -> 'retailTiers') t);
  fee_r numeric := (p_payload -> 'costs' -> 'paymentFee' ->> 'retail')::numeric;
  fee_w numeric := (p_payload -> 'costs' -> 'paymentFee' ->> 'wholesale')::numeric;
  res_r numeric := (p_payload -> 'costs' -> 'returnReserve' ->> 'retail')::numeric;
  res_w numeric := (p_payload -> 'costs' -> 'returnReserve' ->> 'wholesale')::numeric;
  floor_ numeric := coalesce((p_payload -> 'costs' ->> 'netFloor')::numeric, 0);
  promo_w boolean := (p_payload -> 'promo' -> 'channels') ? 'wholesale';
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'decision note required'; end if;
  if p_effective_from < current_date then raise exception 'effective date in the past'; end if;
  if take_r not between 0.15 and 0.20 then raise exception 'retail take outside band'; end if;
  if take_w not between 0.05 and 0.08 then raise exception 'wholesale take outside band'; end if;
  if amb_w not between 0.015 and 0.03 then raise exception 'wholesale commission outside band'; end if;
  if take_r - top_tier - leader - cap - fee_r - res_r < floor_ then raise exception 'retail worst case below floor'; end if;
  if take_w - amb_w - leader - (case when promo_w then cap else 0 end) - fee_w - res_w < floor_ then
    raise exception 'wholesale worst case below floor';
  end if;
  select coalesce(max(version), 1) + 1 into next_version from public.platform_settings;
  insert into public.platform_settings (version, effective_from, note, payload, created_by, created_by_id)
  values (next_version, p_effective_from, p_note, p_payload || jsonb_build_object('version', next_version),
          coalesce((select full_name from public.profiles where id = auth.uid()), ''), auth.uid());
  perform public.audit('settings.publish', 'platform_settings', next_version::text,
                       jsonb_build_object('effective_from', p_effective_from, 'note', p_note));
  return next_version;
end $$;

create or replace function public.active_settings() returns jsonb
language sql stable security definer set search_path = public as $$
  select payload from public.platform_settings
  where effective_from <= current_date order by effective_from desc, version desc limit 1;
$$;

-- ── CMS (existing tables, hardened) ─────────────────────────────────────
create table if not exists public.cms_entries (
  id bigint generated by default as identity primary key,
  key text not null, lang text not null check (lang in ('ar', 'en', 'ur', 'id')),
  page_key text not null default 'general', area text not null default '',
  label_ar text, label_en text, value text not null default '', kind text not null default 'text',
  published boolean not null default true, sort_order int not null default 0,
  last_editor text, updated_at timestamptz default now(),
  scheduled_at timestamptz, scheduled_value text, scheduled_published boolean, scheduled_editor text,
  unique (key, lang)
);
create table if not exists public.cms_entry_versions (
  id bigint generated by default as identity primary key,
  entry_id bigint, key text not null, lang text not null, page_key text, area text,
  label_ar text, label_en text, value text, kind text, published boolean, sort_order int,
  action text not null, editor text not null default '', created_at timestamptz not null default now()
);
create table if not exists public.cms_media (
  id bigint generated by default as identity primary key,
  title_ar text not null default '', title_en text not null default '',
  kind text not null check (kind in ('video', 'image')), lang text not null default 'ar',
  section text not null default 'hero', url text not null, poster_url text, storage_path text,
  status text not null default 'draft', sort_order int not null default 0,
  created_at timestamptz default now()
);

drop trigger if exists cms_versions_append_only on public.cms_entry_versions;
create trigger cms_versions_append_only before update or delete on public.cms_entry_versions
  for each row execute function public.forbid_mutation();

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.kyc_private enable row level security;
alter table public.audit_log enable row level security;
alter table public.platform_settings enable row level security;
alter table public.cms_entries enable row level security;
alter table public.cms_entry_versions enable row level security;
alter table public.cms_media enable row level security;

-- Drop any permissive policies left by earlier versions of the app.
do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public'
             and tablename in ('profiles', 'user_roles', 'kyc_private', 'audit_log', 'platform_settings',
                               'cms_entries', 'cms_entry_versions', 'cms_media')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin());
-- no insert policy: rows come from the trigger only

create policy roles_self_read on public.user_roles for select using (user_id = auth.uid() or public.is_admin());
-- writes only through admin_set_role / admin_set_verification (security definer)

create policy kyc_owner_read on public.kyc_private for select using (user_id = auth.uid());
-- admins see masked values through admin_accounts; writes only through submit_kyc

create policy audit_admin_read on public.audit_log for select using (public.is_admin());

create policy settings_public_read on public.platform_settings for select using (true);

create policy cms_public_read on public.cms_entries for select using (published or public.is_admin());
create policy cms_admin_insert on public.cms_entries for insert with check (public.is_admin());
create policy cms_admin_update on public.cms_entries for update using (public.is_admin());
create policy cms_admin_delete on public.cms_entries for delete using (public.is_admin());

create policy cmsv_admin_read on public.cms_entry_versions for select using (public.is_admin());
create policy cmsv_admin_insert on public.cms_entry_versions for insert with check (public.is_admin());

create policy media_public_read on public.cms_media for select using (status = 'published' or public.is_admin());
create policy media_admin_insert on public.cms_media for insert with check (public.is_admin());
create policy media_admin_update on public.cms_media for update using (public.is_admin());
create policy media_admin_delete on public.cms_media for delete using (public.is_admin());

-- ── storage: public read, admin-only write on the media bucket ──────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 62914560,
        array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_read on storage.objects;
drop policy if exists media_admin_write on storage.objects;
drop policy if exists media_admin_delete on storage.objects;
create policy media_read on storage.objects for select using (bucket_id = 'media');
create policy media_admin_write on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ── grants ───────────────────────────────────────────────────────────────
revoke all on public.kyc_private from anon;
revoke all on public.audit_log from anon;
grant select on public.admin_accounts to authenticated;
grant execute on function public.my_access() to authenticated;
grant execute on function public.submit_kyc(text, text) to authenticated;
grant execute on function public.admin_set_verification(uuid, text) to authenticated;
grant execute on function public.admin_set_role(uuid, app_role, boolean) to authenticated;
grant execute on function public.publish_platform_settings(jsonb, date, text) to authenticated;
grant execute on function public.active_settings() to anon, authenticated;
