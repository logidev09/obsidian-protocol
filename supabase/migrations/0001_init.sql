-- OBSIDIAN Protocol — schema awal
-- Jalankan di SQL Editor project Supabase BARU.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  wallet_address text,
  chain text,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  wallet_address text,
  chain text,
  source text default 'site',
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_email_key on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

drop policy if exists "waitlist public insert" on public.waitlist;
create policy "waitlist public insert" on public.waitlist
  for insert to anon, authenticated with check (true);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, wallet_address, chain)
  values (
    new.id,
    new.raw_user_meta_data ->> 'address',
    coalesce(new.raw_user_meta_data ->> 'chain',
             case when new.email is not null then 'email' end)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
