# Employer Portal (Next.js + Supabase)

A full employer portal for a job board with:
- Employer signup/login (Supabase Auth)
- Company profile management (includes felon-friendly field)
- Job posting form
- Dashboard listing jobs

## Stack
- Next.js (App Router)
- Supabase (Auth + Postgres)
- Tailwind CSS

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3) Create database tables + RLS

Apply the migrations in `supabase/migrations/` — see [supabase/README.md](supabase/README.md)
for the Supabase CLI steps (or paste each file into the SQL Editor in order).

This creates the tables, Row Level Security policies, server-controlled roles,
rate limits, and employer approval / job reporting. Afterwards, make your own
account an admin (instructions in `supabase/README.md`) to use `/admin`.

## 4) Configure Supabase Auth

In Supabase dashboard:
- Enable Email provider
- Add redirect URL for local development:
  - `http://localhost:3000/auth/callback`

## 5) Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## App routes

- `/` - landing page
- `/signup` - employer signup
- `/login` - employer login
- `/profile` - company profile form
- `/jobs/new` - new job form
- `/dashboard` - job listings dashboard

## Notes

- Protected routes (`/dashboard`, `/profile`, `/jobs/new`) redirect unauthenticated users to `/login`.
- Dashboard only shows jobs posted by the authenticated employer.
- Both company and job records support `felon_friendly` boolean fields.
