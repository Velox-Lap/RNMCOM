# Supabase setup for RNMCOM

## Live project

- Project: RNMCOM
- Project ref: `psgfyujnvidtwvegucnh`
- Region: Singapore (`ap-southeast-1`)
- API URL: `https://psgfyujnvidtwvegucnh.supabase.co`
- Database engine: PostgreSQL 17

The initial schema, policy/performance cleanup, TCAS learning/practice migrations and metadata-only audit-event migration have been applied successfully. The versioned migration files are kept in `supabase/migrations/` for reproducible setup.

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
- The Supabase security advisor returned no lints after the audit migration.
- Critical school-data changes are recorded in `audit_logs` by database triggers. The log stores actor, operation, resource type/identifier and changed field names—not copied student/guardian values.
- Application clients cannot insert, update or delete audit log rows; authenticated administrators retain read access.
- Duplicate permissive SELECT policy overlaps were removed; foreign-key indexes were added where the advisor identified missing coverage.
- Separate inspection still identifies `private.tcas_answer_keys` as a table with RLS disabled. Its grants to `anon` and `authenticated` are revoked and the grading RPC is owner-privileged, but the Supabase table inspection continues to flag it. This is a manual security decision and is not silently changed by this migration.

## Implemented product workflows

The current UI reads permitted student, assignment, class, subject, announcement and notification records, and supports authenticated announcement creation, assignment creation and attendance-session creation. Attendance session creation does not yet complete the attendance register; the live attendance UI is intentionally gated until marking and review are implemented.

## Production readiness gate

The connected database was inspected on 10 November 2026. The core school tables currently contain zero profiles, roles, students, teachers, classes, subjects, attendance sessions, attendance records, assignments, submissions, grades, announcements, notifications and guardian links. The project is healthy, but it is not populated with operational school data. Do not turn off Demo Mode or invite students yet.

The Supabase table inspection also reports `private.tcas_answer_keys` with RLS disabled. Direct `anon` and `authenticated` table grants are revoked, and the grading function accesses the table through a restricted owner-privileged RPC. The advisor finding remains visible for a human security decision; do not expose this schema or grant client access.

Attendance marking/corrections/approval, QR token issuance/expiry, student file uploads/submissions, teacher grading/feedback, administrator-led user provisioning, direct messaging, push delivery/read receipts, guardian multi-child workflows, full payment collection/reconciliation, complete report generation, backups/restore drills, privacy notices, PDPA review and operational incident procedures still require implementation and school acceptance testing. See `docs/QA-PRODUCTION-READINESS.md`.
