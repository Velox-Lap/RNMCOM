# First administrator and staff provisioning

## First administrator
- The school appoints one authorized person and provides their official school email.
- An operator gives that person the one-time setup code out of band.
- Open `/setup/first-admin`, enter the code, name and school email.
- The Edge Function hashes the code, atomically claims it, checks that no admin role exists, sends a Supabase Auth invitation, and assigns the first `admin` role server-side.
- The invited administrator follows the email link and sets a password at `/auth/update-password`.
- The code expires after seven days and can only be consumed once. It is never stored in plaintext.

## Invite teachers
- Sign in as the first administrator.
- Open Dashboard → School management → Teachers.
- Invite the teacher using their school email, name and optional employee code, department and title.
- Choose `teacher` or `homeroom_teacher`.
- Supabase Auth sends the invitation. The Edge Function creates the profile, role and teacher record; the invited user sets their own password.

## Required deployment configuration
- Set Supabase Auth Site URL to `https://rnmcom.vercel.app`.
- Add these Supabase Auth Redirect URLs: `https://rnmcom.vercel.app/auth/callback`, `https://rnmcom-*.vercel.app/auth/callback`, and `http://localhost:3000/auth/callback` for local development.
- Configure the Auth email provider / SMTP and verify the invitation email template uses the Supabase confirmation URL.
- Set `APP_SITE_URL=https://rnmcom.vercel.app` for both Edge Functions (the browser Origin is also validated for supported RNMCOM preview deployments).
- Ensure Vercel has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Security
- No public sign-up or client-side role assignment.
- Bootstrap RPC functions are executable only by `service_role`.
- The token table is in the private schema with no client privileges.
- The database serializes first-admin claims and re-checks the absence of an admin role before completion.
- Teacher invitations require a valid signed-in administrator and allow only teacher roles.
