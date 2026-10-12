-- NISHANT VEG STORE: schema, Row Level Security, storage, realtime.
-- Run in Supabase Dashboard > SQL Editor.

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  image_url   text,
  image_path  text,
  price       numeric(10,2) not null check (price > 0 and price <= 100000),
  unit        text not null default 'kg' check (unit in ('kg','500g','250g','piece','bunch')),
  in_stock    boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index products_name_unique on public.products (lower(btrim(name)));

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- Admin allow-list. RLS is on with NO policies, so the API can never read or write it.
create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admin_users enable row level security;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.products enable row level security;
create policy "Anyone can read products" on public.products for select to anon, authenticated using (true);
create policy "Admins insert products" on public.products for insert to authenticated with check (public.is_admin());
create policy "Admins update products" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete products" on public.products for delete to authenticated using (public.is_admin());

-- Image storage (public read, admin-only write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "Admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- Realtime: push product changes to every open phone
alter publication supabase_realtime add table public.products;
