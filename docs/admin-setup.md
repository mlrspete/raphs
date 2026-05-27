# Admin Setup

Monroes admin access uses Supabase Auth plus the `admin_profiles` table.

## Create An Admin User

1. Open the Supabase project dashboard.
2. Go to Authentication, then Users.
3. Create the owner/admin user with an email and password.
4. Copy the new Auth user UUID.
5. Insert a matching `admin_profiles` row:

```sql
insert into public.admin_profiles (id, email, role)
values ('<auth-user-uuid>', '<admin-email>', 'admin')
on conflict (id) do update
set email = excluded.email,
    role = excluded.role;
```

## Configure Redirect URLs

In Supabase Auth settings, add the callback URLs used by local and production deployments:

- `https://raphs.vercel.app/auth/callback`
- `https://raphs.vercel.app/auth/confirm`
- `https://monroes.au/auth/callback` after the permanent domain is connected
- `https://monroes.au/auth/confirm` after the permanent domain is connected
- `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/confirm` for local development only

The current admin login form uses email/password auth and redirects the browser to `/admin` after a successful sign-in. Member secure-link auth is generated server-side with Supabase `auth.admin.generateLink`, sent through Monroes transactional email, and confirms through `/auth/confirm`, then to `/member`. Non-admin authenticated users are shown an access-denied state.

For hosted Supabase auth emails, keep the Confirm Signup and Magic Link templates on `{{ .ConfirmationURL }}` and never point auth emails directly at `{{ .SiteURL }}/member`. Member sign-in should not rely on the hosted Supabase template: the app sends a Monroes email that includes a `/auth/confirm?token_hash=...&type=magiclink` link plus the fallback 6-digit code returned by Supabase. If a member receives a plain `noreply@mail.app.supabase.io` email, the deployed app is still using an old flow or the Monroes transactional email environment is missing.

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `TRANSACTIONAL_EMAIL_FROM`

`SUPABASE_SERVICE_ROLE_KEY` must remain server-only. It is used by the protected member sign-in email route to generate Supabase token hashes and one-time codes without exposing admin credentials to the browser.

Set these variables in Vercel Production and redeploy after saving them. Existing deployments do not receive newly-added environment variables until a fresh deploy is created.
