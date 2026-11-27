# Database

The schema lives in [`migrations/`](migrations/) as numbered files that run in order:

| Migration | What it does |
|---|---|
| `20260101000000_base_schema` | Tables (`jobs`, `company_profiles`, `user_profiles`, `job_applications`) and baseline RLS |
| `20260101000100_fix_onboarding` | Onboarding columns and the `bootstrap_user_profile()` function |
| `20260101000200_relax_profile_columns` | Lets profile rows be created before name/email are filled in |
| `20261122000000_security_hardening` | Server-controlled roles, role-aware RLS, locked AI columns, private resumes bucket |
| `20261126000000_rate_limits` | Per-user API rate limits |
| `20261126000100_trust_safety` | Employer approval, hidden listings, job reports, admin flag |

Never edit a migration that has already been applied. Add a new file instead
(`supabase migration new <name>`).

## Applying migrations with the Supabase CLI (recommended)

One-time setup:

```bash
brew install supabase/tap/supabase
supabase init            # adds supabase/config.toml; keeps the migrations folder
supabase login
supabase link --project-ref <your-project-ref>
```

### The existing production database

It was originally built by pasting SQL into the dashboard, so tell the CLI which
migrations it already has. The first two were applied by hand:

```bash
supabase migration repair --status applied 20260101000000 20260101000100
```

If you already pasted any of the later files into the SQL editor, that's fine:
they're written to be re-run safely. Then apply the rest:

```bash
supabase db push --dry-run   # review what will run
supabase db push
```

### A new / local database

```bash
supabase start      # local Postgres in Docker
supabase db reset   # runs every migration from scratch
```

## Without the CLI

Paste each file into the Supabase SQL Editor **in the order above**.

## After `trust_safety`: make yourself an admin

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
where email = 'you@example.com';
```

Sign out and back in, then open `/admin`.
