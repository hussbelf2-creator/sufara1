-- Migration 010 · KYB follows its own rules
--  • changing which document types are required (or retiring one) re-evaluates
--    every factory at once. A newly required certificate does not pull verified
--    factories off the store overnight: their owners are told at once and get
--    a 30-day grace period before the factory drops back to pending;
--  • the nightly run re-evaluates factories whose documents expired and warns
--    owners 30 days before an approved document expires (once per document);
--  • kyb_missing() answers only the factory's owner or an admin;
--  • admin_factory_kyb gives the compliance screen one row per factory.

create or replace function public.kyb_missing(p_factory text) returns text[]
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is not null and auth.role() <> 'service_role'
     and not (public.owns_factory(p_factory) or public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return (select coalesce(array_agg(t.code order by t.sort_order), '{}')
    from public.document_types t
    where t.active and t.required and not exists (
      select 1 from public.factory_documents d
      where d.factory_id = p_factory and d.type_code = t.code and d.status = 'approved'
        and (d.expires_on is null or d.expires_on >= current_date)));
end $$;
revoke execute on function public.kyb_missing(text) from public, anon;
grant execute on function public.kyb_missing(text) to authenticated, service_role;

alter table public.document_types add column if not exists required_since timestamptz;
update public.document_types set required_since = now() where required and required_since is null;

create or replace function public.recompute_factory_kyb(p_factory text) returns text
language plpgsql security definer set search_path = public as $$
declare missing text[] := public.kyb_missing(p_factory); cur verification_state; next_state verification_state; owner uuid; overdue boolean;
begin
  select kyb_status, owner_id into cur, owner from public.factories where id = p_factory;
  if cur is null or cur = 'rejected' then return coalesce(cur::text, 'unknown'); end if;
  if cardinality(missing) = 0 then
    next_state := 'verified';
  elsif cur = 'verified' then
    /* still inside the grace period of every missing requirement → stays verified */
    overdue := exists (select 1 from public.document_types t
                       where t.code = any(missing) and coalesce(t.required_since, '-infinity') <= now() - interval '30 days');
    next_state := case when overdue then 'pending' else 'verified' end;
  else
    next_state := 'pending';
  end if;
  if next_state is distinct from cur then
    update public.factories set kyb_status = next_state where id = p_factory;
    if owner is not null and next_state = 'verified' then
      perform public.notify(owner, 'kyb.verified', 'تم توثيق المصنع', 'اكتملت الوثائق المطلوبة ويمكن نشر منتجاتك بعد مراجعتها.',
                            '/dashboard?mode=factory&view=f-products');
    elsif owner is not null then
      perform public.notify(owner, 'kyb.suspended', 'توقف توثيق المصنع', 'وثيقة إلزامية منتهية أو ناقصة. ارفعها لاستعادة التوثيق.',
                            '/dashboard?mode=factory&view=f-join');
    end if;
  end if;
  return next_state::text;
end $$;

create or replace function public.document_type_required() returns trigger
language plpgsql security definer set search_path = public as $$
declare f record;
begin
  if new.required and new.active and (tg_op = 'INSERT' or not (old.required and old.active)) then
    new.required_since := now();
    for f in select id, owner_id from public.factories where kyb_status = 'verified' and owner_id is not null
               and not exists (select 1 from public.factory_documents d
                               where d.factory_id = factories.id and d.type_code = new.code and d.status = 'approved') loop
      perform public.notify(f.owner_id, 'kyb.new_requirement', 'وثيقة جديدة مطلوبة',
          'أصبحت «' || new.name_ar || '» إلزامية. ارفعها خلال ٣٠ يومًا ليبقى مصنعك موثّقًا.', '/dashboard?mode=factory&view=f-join');
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists document_types_required on public.document_types;
create trigger document_types_required before insert or update of required, active on public.document_types
  for each row execute function public.document_type_required();

create or replace function public.recompute_all_kyb() returns int
language plpgsql security definer set search_path = public as $$
declare f record; n int := 0;
begin
  for f in select id from public.factories where kyb_status <> 'rejected' loop
    perform public.recompute_factory_kyb(f.id);
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.recompute_all_kyb() from public, anon, authenticated;

create or replace function public.document_types_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_all_kyb();
  return null;
end $$;
drop trigger if exists document_types_recompute on public.document_types;
create trigger document_types_recompute after insert or update of required, active or delete on public.document_types
  for each statement execute function public.document_types_changed();

alter table public.factory_documents add column if not exists expiry_notified_at timestamptz;

create or replace function public.kyb_expiry_sweep() returns jsonb
language plpgsql security definer set search_path = public as $$
declare d record; warned int := 0; factories int;
begin
  for d in
    select fd.id, fd.expires_on, f.owner_id, coalesce(t.name_ar, fd.type_code) as type_name, f.name_ar as factory_name
    from public.factory_documents fd
    join public.factories f on f.id = fd.factory_id
    left join public.document_types t on t.code = fd.type_code
    where fd.status = 'approved' and fd.expiry_notified_at is null
      and fd.expires_on is not null and fd.expires_on <= current_date + 30
  loop
    if d.owner_id is not null then
      perform public.notify(d.owner_id, 'kyb.expiring', 'وثيقة تقترب من الانتهاء',
        d.type_name || ' تنتهي في ' || to_char(d.expires_on, 'YYYY-MM-DD') || '. ارفع النسخة المجددة حتى لا يتوقف النشر.',
        '/dashboard?mode=factory&view=f-join');
    end if;
    perform public.notify_admins('kyb.expiring', 'وثيقة مصنع تقترب من الانتهاء',
      d.factory_name || ' · ' || d.type_name || ' · ' || to_char(d.expires_on, 'YYYY-MM-DD'),
      '/dashboard?mode=admin&view=admin-compliance');
    update public.factory_documents set expiry_notified_at = now() where id = d.id;
    warned := warned + 1;
  end loop;
  factories := public.recompute_all_kyb();
  return jsonb_build_object('expiry_warnings', warned, 'factories_rechecked', factories);
end $$;
revoke execute on function public.kyb_expiry_sweep() from public, anon, authenticated;

create or replace function public.run_nightly() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  perform public.require_server();
  r := public.run_commission_engine();
  return r || jsonb_build_object('groups_awaiting_decision', public.expire_group_orders())
           || public.kyb_expiry_sweep();
end $$;

create or replace view public.admin_factory_kyb with (security_barrier = true) as
  select f.id, f.name_ar, f.kyb_status, public.kyb_missing(f.id) as missing,
         (select count(*) from public.factory_documents d where d.factory_id = f.id and d.status = 'pending') as pending_docs,
         (select min(d.expires_on) from public.factory_documents d
           where d.factory_id = f.id and d.status = 'approved' and d.expires_on >= current_date) as next_expiry
  from public.factories f where public.is_admin();
grant select on public.admin_factory_kyb to authenticated;
