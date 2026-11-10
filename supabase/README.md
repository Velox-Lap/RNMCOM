# Supabase setup for RNMCOM

## Live project

- Project: RNMCOM
- Project ref: `psgfyujnvidtwvegucnh`
- Region: Singapore (`ap-southeast-1`)
- API URL: `https://psgfyujnvidtwvegucnh.supabase.co`
- Database engine: PostgreSQL 17

The initial schema, policy/performance cleanup, and anonymous-privilege hardening migrations have been applied successfully. All three versioned migration files are kept in `supabase/migrations/` for reproducible setup.

## Application configuration

Copy `.env.example` to `.env.local`. The file includes the public Project URL and publishable key. The publishable key is intended for browser clients; database RLS policies are the security boundary. Never expose a Supabase secret/service key in a `NEXT_PUBLIC_*` variable or commit one to Git.

The local starter defaults to demo mode. To enable authenticated data access, set `NEXT_PUBLIC_RNMCOM_DEMO_MODE=false` only after accounts and school records have been provisioned.

## First administrator and account provisioning

1. Create the trusted administrator in Supabase Auth (email/password or an administrator-issued invitation).
2. Copy the resulting Auth user UUID.
3. Run the bootstrap INSERT from the bottom of `schema.sql`, replacing `<AUTH_USER_UUID>` with the trusted user's UUID.
4. Mark exactly one role as `is_primary = true` for the initial landing workspace.
5. Create class, subject, student and teacher records, then map teaching assignments.
6. Link each guardian to the correct student using `student_guardians`; grant finance access only when formally approved.
7. Add the production Vercel domain to Supabase Auth Site URL and Redirect URLs after deployment.

Public self-registration is intentionally not exposed. Never grant the admin role from user-editable sign-up metadata.

## Security model

- All 21 exposed public application tables have RLS enabled.
- Roles are read from `user_roles`, not user-editable metadata.
- Guardian access requires an explicit relationship row and per-domain permission flags.
- Student-support records are restricted to administrators and designated homeroom teachers.
- Browser clients use only the publishable key.
- Anonymous (`anon`) and `PUBLIC` table/schema grants are revoked; authenticated access is explicitly granted and remains subject to RLS.
- The Supabase security advisor returned no lints after the migrations.
- Duplicate permissive SELECT policy overlaps were removed; foreign-key indexes were added where the advisor identified missing coverage.

## Implemented product workflows

The current UI reads permitted student, assignment, class, subject and announcement records, and supports authenticated announcement creation, assignment creation, and attendance-session creation.

## Not yet production-complete

Attendance marking, QR token issuance/expiry, student file uploads/submissions, teacher grading workflows, direct messaging, push delivery, full payment collection/reconciliation, complete report generation, and automated operational audit events require further implementation and school acceptance testing. Do not use the platform as the live student system until these workflows, account permissions, privacy notices, backups, and operational procedures have been validated.
