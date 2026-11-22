-- Security hardening. Run the whole file once in the Supabase SQL Editor
-- AFTER schema.sql (and fix-onboarding.sql if you use it). Safe to re-run.
--
-- What it does:
--   1. Makes the account role server-controlled (auth.users.raw_app_meta_data),
--      set once at signup. Users can no longer switch roles via updateUser().
--   2. Enforces the role in RLS: only employers write jobs/company profiles,
--      only job seekers write profiles/applications.
--   3. Locks AI-generated job columns so employers can't set their own
--      felony-friendly rating or summary (only the service role can).
--   4. Locks user_profiles.role so users can't change it.
--   5. Makes the "resumes" storage bucket private with per-user folder access.

-- ---------------------------------------------------------------------------
-- 1. Server-controlled role
-- ---------------------------------------------------------------------------

-- At signup, copy the requested role into app_metadata (which users cannot edit).
-- Anything unrecognised becomes the least-privileged role, job_seeker.
create or replace function public.assign_role_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
  assigned text;
begin
  if requested = 'employer' then
    assigned := 'employer';
  else
    assigned := 'job_seeker';
  end if;

  new.raw_app_meta_data :=
    coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', assigned);
  return new;
end;
$$;

drop trigger if exists assign_role_on_signup on auth.users;
create trigger assign_role_on_signup
before insert on auth.users
for each row execute function public.assign_role_on_signup();

-- Backfill existing users who don't have a server-side role yet.
-- Uses their signup metadata, falling back to which profile they own.
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
  'role',
  case
    when u.raw_user_meta_data ->> 'role' = 'employer' then 'employer'
    when u.raw_user_meta_data ->> 'role' in ('job_seeker', 'job-seeker') then 'job_seeker'
    when exists (select 1 from public.company_profiles c where c.user_id = u.id) then 'employer'
    else 'job_seeker'
  end
)
where coalesce(u.raw_app_meta_data ->> 'role', '') not in ('employer', 'job_seeker');

-- Read the caller's role fresh from auth.users (not from a possibly stale JWT).
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select raw_app_meta_data ->> 'role' from auth.users where id = auth.uid();
$$;

revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Role-aware RLS policies
-- ---------------------------------------------------------------------------

-- jobs: anyone signed in can read (existing "Authenticated users can view jobs");
-- only employers can create/modify/delete their own.
drop policy if exists "Employers manage own jobs" on public.jobs;
drop policy if exists "Employers insert own jobs" on public.jobs;
drop policy if exists "Employers update own jobs" on public.jobs;
drop policy if exists "Employers delete own jobs" on public.jobs;

create policy "Employers insert own jobs"
on public.jobs for insert to authenticated
with check (auth.uid() = employer_id and public.current_app_role() = 'employer');

create policy "Employers update own jobs"
on public.jobs for update to authenticated
using (auth.uid() = employer_id and public.current_app_role() = 'employer')
with check (auth.uid() = employer_id and public.current_app_role() = 'employer');

create policy "Employers delete own jobs"
on public.jobs for delete to authenticated
using (auth.uid() = employer_id and public.current_app_role() = 'employer');

-- company_profiles: readable by signed-in users (existing listing policy);
-- only employers can write their own.
drop policy if exists "Employers manage own profile" on public.company_profiles;
drop policy if exists "Employers insert own company profile" on public.company_profiles;
drop policy if exists "Employers update own company profile" on public.company_profiles;
drop policy if exists "Employers delete own company profile" on public.company_profiles;

create policy "Employers insert own company profile"
on public.company_profiles for insert to authenticated
with check (auth.uid() = user_id and public.current_app_role() = 'employer');

create policy "Employers update own company profile"
on public.company_profiles for update to authenticated
using (auth.uid() = user_id and public.current_app_role() = 'employer')
with check (auth.uid() = user_id and public.current_app_role() = 'employer');

create policy "Employers delete own company profile"
on public.company_profiles for delete to authenticated
using (auth.uid() = user_id and public.current_app_role() = 'employer');

-- user_profiles: only job seekers can create one.
drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
on public.user_profiles for insert to authenticated
with check (auth.uid() = user_id and public.current_app_role() = 'job_seeker');

-- job_applications: only job seekers can save/apply.
drop policy if exists "Job seekers manage own applications" on public.job_applications;
create policy "Job seekers manage own applications"
on public.job_applications for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and public.current_app_role() = 'job_seeker');

-- ---------------------------------------------------------------------------
-- 3. Lock AI-generated job columns
-- ---------------------------------------------------------------------------
-- Requests made with a user's token (role 'authenticated'/'anon') cannot set these;
-- the service role (server-side enrichment) and the SQL editor still can.
create or replace function public.protect_job_ai_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.ai_summary := null;
    new.ai_tags := '[]'::jsonb;
    new.felony_friendly_rating := null;
    new.ai_enriched_at := null;
    new.employment_type := null;
    new.schedule := null;
    new.job_category := null;
    new.required_skills := '[]'::jsonb;
    new.preferred_skills := '[]'::jsonb;
  else
    new.id := old.id;
    new.employer_id := old.employer_id;
    new.created_at := old.created_at;
    new.ai_summary := old.ai_summary;
    new.ai_tags := old.ai_tags;
    new.felony_friendly_rating := old.felony_friendly_rating;
    new.ai_enriched_at := old.ai_enriched_at;
    new.employment_type := old.employment_type;
    new.schedule := old.schedule;
    new.job_category := old.job_category;
    new.required_skills := old.required_skills;
    new.preferred_skills := old.preferred_skills;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_job_ai_columns on public.jobs;
create trigger protect_job_ai_columns
before insert or update on public.jobs
for each row execute function public.protect_job_ai_columns();

-- ---------------------------------------------------------------------------
-- 4. Lock user_profiles.role
-- ---------------------------------------------------------------------------
create or replace function public.protect_user_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'job_seeker';
  else
    new.role := old.role;
    new.user_id := old.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_user_profile_role on public.user_profiles;
create trigger protect_user_profile_role
before insert or update on public.user_profiles
for each row execute function public.protect_user_profile_role();

-- ---------------------------------------------------------------------------
-- 5. Private resumes bucket, per-user folders ("<user_id>/resume.pdf")
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own resume" on storage.objects;
drop policy if exists "Users read own resume" on storage.objects;
drop policy if exists "Users update own resume" on storage.objects;
drop policy if exists "Users delete own resume" on storage.objects;

create policy "Users upload own resume"
on storage.objects for insert to authenticated
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read own resume"
on storage.objects for select to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own resume"
on storage.objects for update to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own resume"
on storage.objects for delete to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- Convert any previously saved public URLs to storage paths.
update public.user_profiles
set resume_url = split_part(resume_url, '/object/public/resumes/', 2)
where resume_url like '%/object/public/resumes/%';
