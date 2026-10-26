-- KYB rules: grace period for new requirements, expiry sweep, access to kyb_missing.
\set ON_ERROR_STOP 1
begin;
create or replace function pg_temp.act(p_sub uuid, p_aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_sub::text, ''), true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.aal', p_aal, true);
end $$;
insert into auth.users (id, email, raw_user_meta_data) values
  ('d0000000-0000-0000-0000-00000000000a', 'kyb-admin@safeer.sa', '{}'),
  ('d0000000-0000-0000-0000-00000000000f', 'kyb-owner@factory.sa', '{}'),
  ('d0000000-0000-0000-0000-00000000000e', 'nosy@factory.sa', '{}');
insert into public.user_roles values ('d0000000-0000-0000-0000-00000000000a', 'admin', null, now());
update public.factories set owner_id = 'd0000000-0000-0000-0000-00000000000f' where id = 'hasa';

-- A verified factory with all current requirements approved.
insert into public.factory_documents (factory_id, type_code, storage_path, file_name, expires_on, status)
select 'hasa', code, 'hasa/' || code || '.pdf', code || '.pdf', current_date + 20, 'approved'
from public.document_types where required and active;
do $$ begin
  assert public.recompute_factory_kyb('hasa') = 'verified', 'complete factory verified';
end $$;

-- Admin makes a new certificate required: owner is told, factory keeps its badge during the grace period.
set local role authenticated;
select pg_temp.act('d0000000-0000-0000-0000-00000000000a', 'aal2');
update public.document_types set required = true where code = 'sfda';
reset role;
do $$ begin
  assert (select kyb_status::text from public.factories where id = 'hasa') = 'verified', 'grace period keeps verification';
  assert exists (select 1 from public.notifications where user_id = 'd0000000-0000-0000-0000-00000000000f' and kind = 'kyb.new_requirement'),
    'owner told about the new requirement';
  assert (select required_since from public.document_types where code = 'sfda') > now() - interval '1 minute', 'required_since stamped';
end $$;

-- After the grace period the factory drops back to pending and is told why.
update public.document_types set required_since = now() - interval '31 days' where code = 'sfda';
do $$ begin
  assert public.recompute_factory_kyb('hasa') = 'pending', 'overdue requirement suspends verification';
  assert exists (select 1 from public.notifications where user_id = 'd0000000-0000-0000-0000-00000000000f' and kind = 'kyb.suspended'), 'owner told';
end $$;

-- Retiring the requirement restores verification immediately (statement trigger).
set local role authenticated;
select pg_temp.act('d0000000-0000-0000-0000-00000000000a', 'aal2');
update public.document_types set required = false where code = 'sfda';
reset role;
do $$ begin
  assert (select kyb_status::text from public.factories where id = 'hasa') = 'verified', 'retiring the type re-verifies';
end $$;

-- Expiry sweep warns once, 30 days ahead, to owner and admins.
do $$ declare r jsonb; begin
  r := public.kyb_expiry_sweep();
  assert (r->>'expiry_warnings')::int >= 1, 'documents expiring within 30 days flagged';
  assert (select count(*) from public.notifications where user_id = 'd0000000-0000-0000-0000-00000000000f' and kind = 'kyb.expiring') >= 1, 'owner warned';
  assert exists (select 1 from public.notifications where audience = 'admins' and kind = 'kyb.expiring'), 'admins warned';
  r := public.kyb_expiry_sweep();
  assert (r->>'expiry_warnings')::int = 0, 'warned only once per document';
end $$;

-- kyb_missing: owner and admin only; the admin view lists every factory.
set local role authenticated;
select pg_temp.act('d0000000-0000-0000-0000-00000000000e');
do $$ begin
  begin perform public.kyb_missing('hasa'); raise exception 'FAIL: stranger read kyb_missing';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from public.admin_factory_kyb) = 0, 'non-admin sees no KYB rows';
end $$;
select pg_temp.act('d0000000-0000-0000-0000-00000000000f');
do $$ begin assert public.kyb_missing('hasa') = '{}', 'owner reads own gaps'; end $$;
select pg_temp.act('d0000000-0000-0000-0000-00000000000a', 'aal2');
do $$ begin
  assert (select count(*) from public.admin_factory_kyb) >= 3, 'admin sees all factories';
  assert (select pending_docs from public.admin_factory_kyb where id = 'hasa') = 0, 'pending count';
end $$;
rollback;
\echo 'KYB RULES CHECKS PASSED'
