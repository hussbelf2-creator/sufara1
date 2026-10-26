-- Safeer · 004 — storefront fields the catalogue needs from the database.
alter table public.products add column if not exists short_ar text not null default '';
alter table public.products add column if not exists short_en text not null default '';
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists description_ar text;
alter table public.products add column if not exists description_en text;
