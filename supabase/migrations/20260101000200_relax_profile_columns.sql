-- The original schema made first_name, last_name and email NOT NULL, but the
-- onboarding bootstrap (bootstrap_user_profile) and the profile API create rows
-- without them. Relax the constraints so a database built from these migrations
-- behaves like the live one. Safe to re-run.
alter table public.user_profiles alter column first_name drop not null;
alter table public.user_profiles alter column last_name drop not null;
alter table public.user_profiles alter column email drop not null;
