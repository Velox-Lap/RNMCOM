# RNMCOM Auth recovery and onboarding

## Why the previous password-reset email returned to sign-in
The previous recovery email used Supabase's default `{{ .ConfirmationURL }}` PKCE link. The callback exchanged the auth code and silently returned to `/login` whenever the PKCE exchange failed. PKCE code exchange depends on the verifier stored by the browser that initiated the recovery request; opening a link in a different browser context can therefore lose the verifier.

The app callback now supports both:
- `token_hash` + `type=recovery|invite` using server-side `verifyOtp` and cookie persistence. This does not depend on the requesting browser's PKCE verifier.
- Existing `code` callbacks using `exchangeCodeForSession`.

The update-password page now checks for a real session before showing the form. Expired or already-used links get a clear recovery message instead of presenting a non-working form.

## Required Supabase Dashboard email-template change
The repository code is ready for token-hash links, but hosted Supabase email templates are project configuration and are not stored in Git. Update them once in **Supabase Dashboard → Authentication → Email Templates**.

### Reset Password template
Set the HTML content to:

```html
<h2>Reset your RNMCOM password</h2>
<p>We received a request to reset your password. Use the secure link below to choose a new one.</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=%2Fauth%2Fupdate-password">Reset password</a></p>
<p>If you did not request this, you can safely ignore this email.</p>
```

### Invite User template
Set the HTML content to:

```html
<h2>You have been invited to RNMCOM</h2>
<p>Use the secure link below to set your password and access your school workspace.</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=invite&amp;next=%2Fauth%2Fupdate-password">Accept invitation</a></p>
```

Set the Auth **Site URL** to `https://rnmcom.vercel.app`. Ensure `https://rnmcom.vercel.app/auth/callback` is in the allowed Redirect URLs. The token-hash templates use `.SiteURL` directly and the app callback verifies the hash server-side.

After saving the templates, request a **new** password-reset email. Previously sent messages still contain the old PKCE link and are not rewritten.

## User flow after the template change
1. User selects **Forgot password?** on `https://rnmcom.vercel.app/login`.
2. Supabase sends a one-time recovery token hash link.
3. The callback verifies the hash with `verifyOtp({ token_hash, type: "recovery" })`.
4. The callback stores the resulting session in Supabase SSR cookies and redirects to `/auth/update-password`.
5. The user enters and confirms a new password (minimum 12 characters).
6. The app calls `auth.updateUser({ password })` and routes to the dashboard.

Teacher invitations use the same token-hash callback with `type=invite` after the Invite User template is updated.

## Security notes
- Tokens are single-use and must never be logged or copied into support messages.
- The callback only accepts the expected OTP types and only allows local in-app destinations.
- The callback logs only safe error codes/status, never the URL, token hash, auth code, or credentials.
- Passwords are sent directly to Supabase Auth over HTTPS. RNMCOM never stores plaintext passwords.
- Never ask a user to send a password or recovery link to support.
