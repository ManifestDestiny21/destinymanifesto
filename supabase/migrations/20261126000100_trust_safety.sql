-- Trust & safety: employer approval, hidden listings, job reports, admin flag.
-- Safe to re-run. See supabase/README.md for how to apply.
--
-- After running, make yourself an admin (replace the email):
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
--   where email = 'you@example.com';
-- Then sign out and back in.

-- ---------------------------------------------------------------------------
-- Admin flag (app_metadata.is_admin; only settable from SQL / service role)
-- ---------------------------------------------------------------------------
create or replace function public.current_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((raw_app_meta_data ->> 'is_admin')::boolean, false)
  from auth.users where id = auth.uid();
$$;

revoke all on function public.current_is_admin() from public;
grant execute on function public.current_is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Employer approval
-- ---------------------------------------------------------------------------
alter table public.company_profiles
  add column if not exists approval_status text not null default 'pending';
alter table public.company_profiles add column if not exists reviewed_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'company_profiles_approval_status_check'
  ) then
    alter table public.company_profiles
      add constraint company_profiles_approval_status_check
      check (approval_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- Employers that already existed before approval was introduced stay live.
-- (Runs only once: marker row in a tiny settings table.)
create table if not exists public.app_migrations_applied (name text primary key);
alter table public.app_migrations_applied enable row level security;
revoke all on public.app_migrations_applied from anon, authenticated;

do $$
begin
  if not exists (select 1 from public.app_migrations_applied where name = 'approve_existing_employers') then
    update public.company_profiles set approval_status = 'approved', reviewed_at = now()
    where approval_status = 'pending';
    insert into public.app_migrations_applied (name) values ('approve_existing_employers');
  end if;
end $$;

-- Employers can't approve themselves: user-token writes can't touch approval fields.
create or replace function public.protect_company_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.approval_status := 'pending';
    new.reviewed_at := null;
  else
    new.approval_status := old.approval_status;
    new.reviewed_at := old.reviewed_at;
    new.user_id := old.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_company_approval on public.company_profiles;
create trigger protect_company_approval
before insert or update on public.company_profiles
for each row execute function public.protect_company_approval();

-- ---------------------------------------------------------------------------
-- Hidden listings (set by admins, or automatically after repeated reports)
-- ---------------------------------------------------------------------------
alter table public.jobs add column if not exists hidden boolean not null default false;
alter table public.jobs add column if not exists hidden_reason text;

create or replace function public.protect_job_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') not in ('authenticated', 'anon')
     or current_setting('app.moderation', true) = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.hidden := false;
    new.hidden_reason := null;
  else
    new.hidden := old.hidden;
    new.hidden_reason := old.hidden_reason;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_job_moderation on public.jobs;
create trigger protect_job_moderation
before insert or update on public.jobs
for each row execute function public.protect_job_moderation();

-- Is this employer approved? (security definer so job policies can check it.)
create or replace function public.is_approved_employer(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.company_profiles
    where user_id = p_user_id and approval_status = 'approved'
  );
$$;

revoke all on function public.is_approved_employer(uuid) from public;
grant execute on function public.is_approved_employer(uuid) to authenticated;

-- Job seekers only see visible listings from approved employers.
-- Employers always see their own; admins see everything.
drop policy if exists "Authenticated users can view jobs" on public.jobs;
drop policy if exists "View visible jobs" on public.jobs;
create policy "View visible jobs"
on public.jobs for select to authenticated
using (
  auth.uid() = employer_id
  or public.current_is_admin()
  or (not hidden and public.is_approved_employer(employer_id))
);

drop policy if exists "Authenticated users can view company profiles for listings" on public.company_profiles;
drop policy if exists "View approved company profiles" on public.company_profiles;
create policy "View approved company profiles"
on public.company_profiles for select to authenticated
using (
  auth.uid() = user_id
  or public.current_is_admin()
  or approval_status = 'approved'
);

-- The job feed (server-side) reads through this view, so the same visibility
-- rule applies even when the service role is used.
create or replace view public.seeker_visible_jobs
with (security_invoker = true) as
select j.*
from public.jobs j
join public.company_profiles c on c.user_id = j.employer_id
where not j.hidden and c.approval_status = 'approved';

revoke all on public.seeker_visible_jobs from anon;
grant select on public.seeker_visible_jobs to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Job reports
-- ---------------------------------------------------------------------------
create table if not exists public.job_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('scam', 'asks_for_money', 'personal_info', 'offensive', 'misleading', 'other')),
  details text check (char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  reviewed_at timestamp with time zone,
  unique (job_id, reporter_id)
);

create index if not exists job_reports_open_idx on public.job_reports (job_id) where status = 'open';

alter table public.job_reports enable row level security;

drop policy if exists "Job seekers file reports" on public.job_reports;
create policy "Job seekers file reports"
on public.job_reports for insert to authenticated
with check (
  auth.uid() = reporter_id
  and public.current_app_role() = 'job_seeker'
  and status = 'open'
);

drop policy if exists "Reporters see own reports" on public.job_reports;
create policy "Reporters see own reports"
on public.job_reports for select to authenticated
using (auth.uid() = reporter_id or public.current_is_admin());

-- Auto-hide a listing once 3 different job seekers have open reports on it,
-- so a scam doesn't stay up while waiting for review.
create or replace function public.auto_hide_reported_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  open_reports integer;
begin
  select count(*) into open_reports
  from public.job_reports where job_id = new.job_id and status = 'open';

  if open_reports >= 3 then
    perform set_config('app.moderation', 'on', true);
    update public.jobs
    set hidden = true, hidden_reason = 'Automatically hidden after multiple reports'
    where id = new.job_id and not hidden;
    perform set_config('app.moderation', 'off', true);
  end if;
  return new;
end;
$$;

drop trigger if exists auto_hide_reported_job on public.job_reports;
create trigger auto_hide_reported_job
after insert on public.job_reports
for each row execute function public.auto_hide_reported_job();
