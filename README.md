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
3. Run `npm install`.
4. Run `npm run dev`.

The local starter remains in demo mode by default. It uses illustrative sample data and does not write to the live school database.

## Supabase backend

The RNMCOM Supabase project is provisioned in Singapore:

- Project ref: `psgfyujnvidtwvegucnh`
- API URL: `https://psgfyujnvidtwvegucnh.supabase.co`
- Database migrations: `supabase/migrations/`
- Schema snapshot: `supabase/schema.sql`
- Generated client types: `lib/database.types.ts`

All versioned migrations currently in the repository have been applied to the connected Supabase project. The 20 public application tables covered by the base schema have RLS enabled; anonymous table grants are revoked. A follow-up migration adds metadata-only audit triggers to 20 operational tables and makes application audit logs append-only. Access is controlled through trusted role assignments and teacher/class and guardian/student relationships. See [Supabase setup](supabase/README.md) before provisioning accounts or importing real student data.

## Vercel deployment

Import `Velox-Lap/RNMCOM` into Vercel as a Next.js project, then add these environment variables to Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL` — use the value in `.env.example`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — use the value in `.env.example`
- `NEXT_PUBLIC_RNMCOM_DEMO_MODE` — keep `true` during review; change to `false` only after the first administrator and school data are provisioned.

After Vercel assigns the production domain, add that exact domain to Supabase Auth's Site URL and Redirect URLs. Do not add a Supabase secret/service key to browser-exposed environment variables.

## Product scope

The current release provides five role workspaces, responsive navigation, persisted light/dark appearance, demo-only illustrative metrics, Supabase-backed loading of permitted students, assignments, classes, subjects, announcements and notifications, login/password recovery UI, announcement and assignment creation, attendance-session creation, safer CSV export for supported lists, and database-level metadata audit triggers. Live mode no longer presents illustrative attendance, timetable, staff, grade, finance or report figures as real school data.

The following workflows still require implementation and school validation before operational use: administrator-led user provisioning and onboarding, complete attendance marking/correction/approval and QR token issuance, student submission upload and teacher grading, direct messaging and delivery/read receipts, guardian multi-child selection and communication preferences, full fee payment/reconciliation, and production reporting/analytics. Finance and student-support records have restrictive database policies but are not complete payment/case-management products. Do not switch Production out of Demo Mode until the first trusted administrator is provisioned, real school records are loaded and verified, and these core workflows pass role-based acceptance tests.

## Design source

The implementation was derived from the supplied RNMCOM Full Product Audit. A fresh read of the latest Figma prototype was blocked by the connected Figma Starter plan's tool-call limit during implementation; pixel-level parity with the latest Figma file has not been verified.

## CI

GitHub Actions runs dependency installation, TypeScript checks, and a production Next.js build on pushes and pull requests to `main`.
