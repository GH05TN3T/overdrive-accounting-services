create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  business text,
  service text not null,
  appointment_date date not null,
  notes text,
  status text not null default 'new' check (status in ('new', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text,
  client_email text not null,
  file_name text not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.documents enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "Anyone can request an appointment"
  on public.appointments for insert
  with check (true);

create policy "Admins can manage appointments"
  on public.appointments for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Clients can read their documents"
  on public.documents for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Clients can add their own documents"
  on public.documents for insert
  with check (user_id = auth.uid());

create policy "Admins can manage documents"
  on public.documents for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete documents"
  on public.documents for delete
  using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do nothing;

create policy "Clients can upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'client-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Clients can read their own files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'client-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "Admins can delete client files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'client-documents' and public.is_admin());

alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.documents;

-- Create an auth user in Supabase, then promote that user's UUID to admin:
-- update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';
