# RNMCOM QA and Production Readiness

**Review date:** 10 November 2026  
**Scope:** Five role workspaces, live-data behavior, database access controls, theme behavior, operational workflows and deployment configuration.

## Verification completed

- Connected repository: `Velox-Lap/RNMCOM`, Next.js 16 / React 19 / TypeScript.
- Connected Supabase project: `RNMCOM`, PostgreSQL 17, status `ACTIVE_HEALTHY`.
- Main-branch Vercel production build inspected: latest deployment reported `READY`; the associated Vercel status check succeeded.
- Database schema inspection confirmed RLS enabled on the public application tables inspected.
- Database audit migration applied successfully; post-migration verification found 20 audit triggers.
- Security advisor returned no lints after the audit migration.
- Live table counts were checked. Profiles, user roles, students, teachers, classes, subjects, attendance sessions, attendance records, assignments, submissions, grades, announcements, notifications and guardian links were all empty at review time.
- Live-mode UI was changed so demo-only attendance charts, timetable entries, staff/grade/finance/report figures and sample priority tasks are not presented as real operational data.
- Notification data now comes from the signed-in user's database-visible notification rows in live mode; mark-all-read handles backend errors before showing success.
- CSV export now escapes formula-leading values, includes a UTF-8 BOM, avoids empty exports and is only offered in views that have supported data.

## Role acceptance matrix

The database is currently unpopulated, so role-based end-to-end acceptance cannot be completed yet. After provisioning test accounts and records, test with separate accounts—not a client-side role selector alone.

| Role | Required verification before release |
|---|---|
| Administrator | Provision users and trusted roles; see only school-scoped records; manage classes, subjects, staff and students; inspect audit history; no client-side role escalation. |
| Teacher | See only assigned classes/subjects; create assignments; take and correct attendance; grade only relevant submissions; audit score changes. |
| Homeroom teacher | See only assigned homeroom students; monitor attendance/academic follow-up; review only authorized support and leave workflows. |
| Student | See own profile, attendance, assignments, grades and learning progress; submit work; cannot read another student's rows or answer keys. |
| Parent/guardian | See only explicitly linked students; test two guardians per student and multiple students per guardian; enforce per-domain permissions, especially finance. |

## Blocking issues

1. **No real school data or accounts:** live database table counts are zero. Import verified class, subject, staff, student and guardian records and provision the first trusted administrator before switching Production out of Demo Mode.
2. **Attendance is incomplete:** session creation exists, but attendance marking, duplicate/edit handling, correction requests, approval, close/reopen controls and guardian/student notifications must be built and tested.
3. **Academic and assignment workflows are incomplete:** student file submission, late/returned states, teacher grading/feedback, grade calculation and academic-history screens need full workflows.
4. **Communication and finance are incomplete:** direct messages, read receipts, notification preferences/delivery, guardian multi-child workflows, invoices and payment reconciliation require implementation.
5. **Manual RLS finding:** `private.tcas_answer_keys` is reported with RLS disabled by the database table inspection. Direct grants to `anon` and `authenticated` are revoked and the grading RPC is owner-privileged, but this finding requires a human security decision. Do not expose the private schema to client roles.
6. **Operational assurance:** confirm Vercel Production and Preview environment values, Auth Site URL/redirect allowlist, backups and restore, monitoring/alerting, rate limits, privacy notice/retention, PDPA review and incident-response ownership.

## Required browser acceptance pass

Run this pass using separate test accounts after seeding a non-production dataset:

- Desktop: 1440 × 900; tablet: 768 × 1024; mobile: 390 × 844 and 360 × 800.
- Light and dark appearance: reload persistence, sign-in, dialogs, tables, notifications, TCAS modules and keyboard focus.
- For each role: sign in, navigate every allowed item, attempt direct URL access to disallowed modules, refresh, sign out, password reset.
- Workflow checks: create/edit/close attendance; duplicate attendance; late/leave/absent/present states; publish assignment; submit; grade; correct grade; guardian notification/read state; audit trail.
- Security checks: cross-student IDOR, cross-class teacher access, guardian relationship removal, forged role metadata, direct answer-key read, replayed/expired QR token, repeated request/idempotency and file upload abuse.
- Confirm empty, loading, error and success feedback for every data-dependent screen.

## Release decision

**Not approved for a live school rollout yet.** The repository contains a deployable web shell and a healthy, secured database foundation, but the data model is empty and several operational workflows are staged or incomplete. Keep Demo Mode enabled for review until the blocking issues above have been resolved and the acceptance pass is signed off by the school.
