-- Run this SQL in your Supabase SQL editor, then run security-hardening.sql

create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null,
  website text,
  location text,
  description text,
  felon_friendly boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  location text not null,
  salary_range text,
  description text not null,
  felon_friendly boolean not null default false,
  employment_type text,
  schedule text,
  job_category text,
  required_skills jsonb default '[]'::jsonb,
  preferred_skills jsonb default '[]'::jsonb,
  ai_summary text,
  ai_tags jsonb default '[]'::jsonb,
  felony_friendly_rating smallint check (felony_friendly_rating >= 0 and felony_friendly_rating <= 5),
  ai_enriched_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Run if jobs table already exists (add AI columns)
alter table public.jobs add column if not exists employment_type text;
alter table public.jobs add column if not exists schedule text;
alter table public.jobs add column if not exists job_category text;
alter table public.jobs add column if not exists required_skills jsonb default '[]'::jsonb;
alter table public.jobs add column if not exists preferred_skills jsonb default '[]'::jsonb;
alter table public.jobs add column if not exists ai_summary text;
alter table public.jobs add column if not exists ai_tags jsonb default '[]'::jsonb;
alter table public.jobs add column if not exists felony_friendly_rating smallint;
alter table public.jobs add column if not exists ai_enriched_at timestamp with time zone;

alter table public.company_profiles enable row level security;
alter table public.jobs enable row level security;

create policy "Employers manage own profile"
on public.company_profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Employers manage own jobs"
on public.jobs
for all
using (auth.uid() = employer_id)
with check (auth.uid() = employer_id);

-- Job seeker profiles
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  about text,
  email text not null,
  date_of_birth date,
  phone text,
  phone_visible_to_employers boolean not null default false,
  contact_consent boolean not null default false,
  street_address text,
  city text,
  county text,
  state text,
  zip_code text,
  resume_url text,
  heard_about_us text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.user_profiles enable row level security;

drop policy if exists "Users manage own profile" on public.user_profiles;

create policy "Users can select own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Resume uploads (create bucket "resumes" in Supabase Storage dashboard, then run policies below)
-- insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false) on conflict do nothing;

-- create policy "Users upload own resume"
-- on storage.objects for insert to authenticated
-- with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- create policy "Users read own resume"
-- on storage.objects for select to authenticated
-- using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- Reentry app: extended profile fields
alter table public.user_profiles add column if not exists preferred_name text;
alter table public.user_profiles add column if not exists search_radius_miles integer;
alter table public.user_profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.user_profiles add column if not exists profile_data jsonb;
alter table public.user_profiles add column if not exists role text;
alter table public.user_profiles add column if not exists onboarding_data jsonb;

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

  insert into public.user_profiles (user_id, role, onboarding_completed, onboarding_data)
  values (auth.uid(), 'job_seeker', false, jsonb_build_object('onboarding_step', 1))
  on conflict (user_id) do nothing;

  select * into profile from public.user_profiles where user_id = auth.uid();
  return profile;
end;
$$;

revoke all on function public.bootstrap_user_profile() from public;
grant execute on function public.bootstrap_user_profile() to authenticated;

-- Job seekers can browse employer job listings
create policy "Authenticated users can view jobs"
on public.jobs
for select
to authenticated
using (true);

create policy "Authenticated users can view company profiles for listings"
on public.company_profiles
for select
to authenticated
using (true);

-- Job seeker saved jobs & applications
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null default 'saved' check (status in ('saved', 'applied', 'interview', 'offer', 'closed')),
  note text,
  applied_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, job_id)
);

alter table public.job_applications enable row level security;

create policy "Job seekers manage own applications"
on public.job_applications
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);