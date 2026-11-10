# RNMCOM — School Management & Communication Platform

RNMCOM is a role-aware school operations workspace for administrators, teachers, homeroom teachers, students, and parents.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS v4 and Lucide icons
- Supabase Auth + PostgreSQL + Row Level Security
- Vercel-ready deployment (Next.js framework auto-detection)

## Run locally

1. Install Node.js 20.9+.
2. Copy `.env.example` to `.env.local`.
3. Run `npm ci`.
4. Run `npm run dev`.

The local starter remains in demo mode by default. It uses illustrative sample data and does not write to the live school database.

## Supabase backend

The RNMCOM Supabase project is provisioned in Singapore:

- Project ref: `psgfyujnvidtwvegucnh`
- API URL: `https://psgfyujnvidtwvegucnh.supabase.co`
- Database migrations: `supabase/migrations/`
- Schema snapshot: `supabase/schema.sql`
- Generated client types: `lib/database.types.ts`

Both migrations are applied to the live project. All 20 public application tables have RLS enabled. Access is controlled through trusted role assignments and teacher/class and guardian/student relationships. See [Supabase setup](supabase/README.md) before provisioning accounts or importing real student data.

## Vercel deployment

Import `Velox-Lap/RNMCOM` into Vercel as a Next.js project, then add these environment variables to Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL` — use the value in `.env.example`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — use the value in `.env.example`
- `NEXT_PUBLIC_RNMCOM_DEMO_MODE` — keep `true` during review; change to `false` only after the first administrator and school data are provisioned.

After Vercel assigns the production domain, add that exact domain to Supabase Auth's Site URL and Redirect URLs. Do not add a Supabase secret/service key to browser-exposed environment variables.

## Product scope

The current release provides five role workspaces, responsive navigation, demo dashboard metrics, Supabase-backed loading of permitted students, assignments and announcements, login/password recovery UI, announcement and assignment creation, attendance-session creation, and CSV export for visible lists.

The following workflows still require implementation and school validation before operational use: student/teacher onboarding administration, attendance marking and QR token issuance, student submission upload and teacher grading, direct messaging and push notifications, full fee payment, and production reporting. Finance and student-support records have restrictive database policies but are not complete payment/case-management products.

## Design source

The implementation was derived from the supplied RNMCOM Full Product Audit. A fresh read of the latest Figma prototype was blocked by the connected Figma Starter plan's tool-call limit during implementation; pixel-level parity with the latest Figma file has not been verified.

## CI

GitHub Actions runs dependency installation, TypeScript checks, and a production Next.js build on pushes and pull requests to `main`.
