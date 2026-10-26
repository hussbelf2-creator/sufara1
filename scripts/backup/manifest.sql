-- Row counts and integrity markers captured with every backup and compared
-- by the restore drill. One JSON object on stdout.
select jsonb_build_object(
  'profiles', (select count(*) from public.profiles),
  'user_roles', (select count(*) from public.user_roles),
  'factories', (select count(*) from public.factories),
  'products', (select count(*) from public.products),
  'orders', (select count(*) from public.orders),
  'sub_orders', (select count(*) from public.sub_orders),
  'order_items', (select count(*) from public.order_items),
  'commissions', (select count(*) from public.commissions),
  'ledger_entries', (select count(*) from public.ledger_entries),
  'ledger_debit', (select coalesce(sum(debit), 0) from public.ledger_entries),
  'invoices', (select count(*) from public.invoices),
  'invoice_head', (select coalesce(max(icv), 0) from public.invoices),
  'factory_documents', (select count(*) from public.factory_documents),
  'shipments', (select count(*) from public.shipments),
  'legal_acceptances', (select count(*) from public.legal_acceptances),
  'platform_settings', (select count(*) from public.platform_settings)
)::text;
