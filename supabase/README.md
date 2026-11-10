# Supabase setup for RNMCOM

## Project setup

1. Create a separate Supabase project for RNMCOM.
2. Use a Singapore region for the Thai user base.
3. Copy the Project URL and publishable key into `.env.local` using `.env.example`.
4. Apply `schema.sql` once to the new, empty database.
5. Create trusted school user accounts in Supabase Auth. Public self-registration is intentionally not exposed.
6. For the first administrator, copy the user's Auth UUID and run the bootstrap INSERT shown at the bottom of `schema.sql`.
7. Provision other users and assign one or more rows in `user_roles`. Mark exactly one role as `is_primary = true` for the initial landing workspace.
8. Link guardians through `student_guardians`; grant finance access only where the school has explicitly approved it.

## Security model

- Browser clients use only the publishable key.
- The secret/service key must remain server-side and is not required by the current browser application.
- Every public application table has RLS enabled.
- Role grants are held in `user_roles`, not user-editable metadata.
- A guardian's access depends on their explicit relationship row and the per-domain permission flags.
- Student support cases are restricted to administrators and the designated homeroom teacher.
- Audit logs are readable only by administrators.

## Operational notes

This first release is a single-school foundation. Multi-school tenancy, direct messaging, push delivery, a full fee-payment lifecycle, QR attendance token issuance and report exports should be added only after the core schema and workflows have been validated with the school.
