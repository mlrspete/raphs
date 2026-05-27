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
- `https://monroes.au/auth/callback` after the permanent domain is connected
- `http://localhost:3000/auth/callback` for local development only

The current admin login form uses email/password auth and redirects the browser to `/admin` after a successful sign-in. Member secure-link auth redirects through `/auth/callback`, then to `/member`. Non-admin authenticated users are shown an access-denied state.

For member magic-link auth, the Supabase Confirm Signup and Magic Link email templates must use `{{ .ConfirmationURL }}` as the auth email link. Do not point auth emails directly at `{{ .SiteURL }}/member`; that skips `/auth/callback` and prevents the app from handling expired or already-used links cleanly.

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is not used for the admin shell auth check. It remains server-only for seed scripts and protected server routes from earlier milestones.
