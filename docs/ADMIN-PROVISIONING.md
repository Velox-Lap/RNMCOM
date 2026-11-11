# First administrator and staff provisioning

## First administrator (no email confirmation)
- The school appoints one authorized person and verifies the intended email address through its own process.
- An operator gives that person the one-time setup code out of band.
- Open `/setup/first-admin`, enter the code, name, school email, and a new password twice.
- The page calls the server-only `bootstrap-first-admin` Edge Function over HTTPS.
- The function atomically claims the one-time code, then calls Supabase Auth Admin `createUser` with `email_confirm: true`. No invitation or confirmation email is sent, and no email callback URL is involved.
- The database trigger creates the profile; the bootstrap RPC assigns the first `admin` role and consumes the code.
- Passwords are never written to RNMCOM tables, metadata, or logs. Supabase Auth stores the password hash.
- The setup code expires after seven days and can only be consumed once. It is stored only as a SHA-256 hash.

## Existing first-admin account created from an earlier invitation
- The current school administrator is already present in Supabase Auth, confirmed, and assigned the `admin` role.
- If that administrator did not finish setting a password after the earlier invitation, open the production sign-in page at `https://rnmcom.vercel.app/login`, select **Forgot password?**, and complete the password-reset link from the same address.
- This is password recovery for an already-confirmed account, not email-address confirmation. The sign-in page sets the recovery redirect from the current website origin, so start from the production domain rather than localhost.
- Never send a password or store it in the school profile tables.

## Invite teachers
- Sign in as the first administrator.
- Open Dashboard → School management → Teachers.
- Invite the teacher using their school email, name and optional employee code, department and title.
- Choose `teacher` or `homeroom_teacher`.
- The current teacher flow sends an Auth invitation; it is separate from first-admin bootstrap. Submit invitations from the production website so the redirect target is the production HTTPS domain, not localhost.

## Required deployment configuration
- Set Supabase Auth Site URL to `https://rnmcom.vercel.app`.
- Add the app callback URLs required by the teacher invitation flow, including the production callback and the specific Vercel preview callback.
- For the first-admin flow, no Auth email redirect is used.
- Set `APP_SITE_URL=https://rnmcom.vercel.app` for both Edge Functions (the browser Origin is also validated for supported RNMCOM preview deployments).
- Ensure Vercel has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Security
- No public sign-up or client-side role assignment.
- First-admin creation requires a high-entropy single-use setup code and is restricted to the first account only.
- The code is hashed in the private schema; claim and completion are serialized and re-check that no admin exists.
- The Edge Function keeps service-role operations server-side and only returns success/error metadata.
- Passwords travel over HTTPS directly to Supabase Auth Admin and are not stored in application tables.
- Teacher invitations require a valid signed-in administrator and allow only teacher roles.
