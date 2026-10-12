-- Store settings editable from the admin panel (currently: WhatsApp order number).
create table public.settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now(),
  constraint whatsapp_number_format check (key <> 'whatsapp_number' or value ~ '^91[6-9][0-9]{9}$')
);
alter table public.settings enable row level security;
create policy "Anyone can read settings" on public.settings for select to anon, authenticated using (true);
create policy "Admins insert settings" on public.settings for insert to authenticated with check (public.is_admin());
create policy "Admins update settings" on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.settings (key, value) values ('whatsapp_number', '916350580036') on conflict do nothing;
alter publication supabase_realtime add table public.settings;
