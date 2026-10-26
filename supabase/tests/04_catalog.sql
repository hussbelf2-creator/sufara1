-- The seeded catalogue is complete and priced like the storefront.
\set ON_ERROR_STOP 1
do $$ begin
  assert (select count(*) from public.products where active) = 24, '24 seeded products';
  assert (select price from public.products where id = 'dates-khalas') = 89, 'retail price';
  assert (select moq from public.products where id = 'dates-khalas') = 50, 'moq';
  assert (select weight_kg from public.products where id = 'dates-khalas') = 1, 'weight parsed';
  assert (select jsonb_array_length(tiers) from public.products where id = 'dates-khalas') = 3, 'tiers';
  assert exists (select 1 from public.categories where id = 'honey'), 'honey category ready';
end $$;
-- anon sees active products only
set role anon;
do $$ begin
  assert (select count(*) from public.products) = 24, 'anon reads active products';
end $$;
reset role;
\echo 'CATALOG CHECKS PASSED'
