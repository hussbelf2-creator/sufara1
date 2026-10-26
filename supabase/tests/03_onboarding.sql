-- Leader invite → sign-up → admin approval → ambassador record on the team.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id, email) values ('40000000-0000-0000-0000-00000000000a', 'agent@umrah.example');
insert into public.ambassadors (user_id, slug, code, is_leader) values ('40000000-0000-0000-0000-00000000000a', 'agent', 'AGENT-1', true);
insert into public.user_roles (user_id, role) values ('40000000-0000-0000-0000-00000000000a', 'admin');

insert into auth.users (id, email, raw_user_meta_data) values
  ('40000000-0000-0000-0000-00000000000b', 'pilgrim.one@example.com',
   '{"full_name":"Pilgrim","requested_panel":"ambassador","leader_code":"agent-1","acquisition_channel":"pilgrims"}');

do $$ begin
  assert (select leader_id from public.profiles where id = '40000000-0000-0000-0000-00000000000b') = '40000000-0000-0000-0000-00000000000a', 'invite attaches leader';
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-0000-0000-00000000000b', true);
select set_config('request.jwt.claim.aal', 'aal1', true);
update public.profiles set leader_id = null where id = auth.uid();
do $$ begin
  assert (select leader_id from public.profiles where id = auth.uid()) is not null, 'member cannot detach / re-point leader';
end $$;

select set_config('request.jwt.claim.sub', '40000000-0000-0000-0000-00000000000a', true);
select set_config('request.jwt.claim.aal', 'aal2', true);
select public.admin_set_verification('40000000-0000-0000-0000-00000000000b', 'verified');
do $$ begin
  assert (select leader_id from public.ambassadors where user_id = '40000000-0000-0000-0000-00000000000b') = '40000000-0000-0000-0000-00000000000a', 'ambassador on the leader team';
  assert (select code from public.ambassadors where user_id = '40000000-0000-0000-0000-00000000000b') like 'PILGRIMO-%', 'code generated';
  begin
    perform public.admin_set_leader('40000000-0000-0000-0000-00000000000b', true);
    raise exception 'FAIL: team member promoted to leader';
  exception when others then
    if sqlerrm not like '%one level%' then raise; end if;
  end;
end $$;
rollback;
\echo 'ONBOARDING CHECKS PASSED'
