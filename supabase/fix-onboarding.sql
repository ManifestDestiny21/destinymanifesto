-- Run this entire file once in Supabase SQL Editor (safe to re-run).

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text,
  onboarding_completed boolean not null default false,
  onboarding_step integer,
  onboarding_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.user_profiles add column if not exists role text;
alter table public.user_profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.user_profiles add column if not exists onboarding_step integer;
alter table public.user_profiles add column if not exists onboarding_data jsonb not null default '{}'::jsonb;

alter table public.user_profiles enable row level security;

drop policy if exists "Users manage own profile" on public.user_profiles;
drop policy if exists "Users can select own profile" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;

create policy "Users can select own profile"
on public.user_profiles for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own profile"
on public.user_profiles for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own profile"
on public.user_profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop function if exists public.bootstrap_user_profile();

create or replace function public.bootstrap_user_profile()
returns public.user_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.user_profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_profiles (
    user_id,
    role,
    onboarding_completed,
    onboarding_step,
    onboarding_data
  )
  values (
    auth.uid(),
    'job_seeker',
    false,
    0,
    jsonb_build_object('onboarding_step', 0)
  )
  on conflict (user_id) do nothing;

  select * into profile from public.user_profiles where user_id = auth.uid();
  return profile;
end;
$$;

revoke all on function public.bootstrap_user_profile() from public;
grant execute on function public.bootstrap_user_profile() to authenticated;
