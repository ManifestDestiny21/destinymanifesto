-- Per-user API rate limits. Run once in the Supabase SQL Editor after
-- security-hardening.sql. Safe to re-run.
--
-- Counters are keyed to the caller's own user id (taken from auth.uid(), not
-- from the request), so one user can never use up another user's allowance.

create table if not exists public.rate_limits (
  key text not null,
  window_start timestamp with time zone not null,
  count integer not null default 0,
  primary key (key, window_start)
);

-- No policies: only the security-definer function below touches this table.
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Returns true if the call is allowed, false once the limit for the current
-- fixed window is reached.
create or replace function public.check_rate_limit(
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  bucket timestamp with time zone;
  current_count integer;
begin
  if uid is null then
    return false;
  end if;

  bucket := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits as r (key, window_start, count)
  values (p_action || ':' || uid::text, bucket, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into current_count;

  -- Occasionally clear out old windows.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;
