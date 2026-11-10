# RNMCOM — School Management & Communication Platform

RNMCOM is a role-aware school operations workspace for administrators, teachers, homeroom teachers, students, and parents.

## Product principles

- One source of truth for school records.
- Security by design: server-verified identity, role-aware access, and row-level security.
- User-centered workflows: each dashboard prioritizes monitoring, decisions, and the next action.
- Responsive layouts for desktop, tablet, and mobile.
- Student privacy first; sensitive student-support information is restricted to authorized school staff.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS v4 (with a small product-specific CSS system)
- Supabase Auth, PostgreSQL, and Row Level Security
- Lucide icons

## Development

1. Copy `.env.example` to `.env.local`.
2. Add the Supabase project URL and publishable key.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.

When Supabase environment variables are absent, the app opens in a clearly labelled demo workspace using non-real sample data. Demo mode is for interface review only and is not an authentication or authorization mechanism.

## Database

See `supabase/schema.sql` for the initial schema, constraints, indexes, and role/relationship-aware RLS policies. The schema is designed for a single school tenant at the initial launch, with explicit guardian-to-student and teacher-to-class relationships.

## Scope and status

This repository starts from an empty Git repository. The implementation is built from the supplied RNMCOM Full Product Audit. The latest Figma prototype could not be fetched through the Figma MCP during this session because the connected Starter plan had reached its tool-call limit; the audit is therefore the current implementation specification until a fresh Figma read is available.

The sample dashboard metrics in demo mode are illustrative values taken from the supplied audit, not live school records.
