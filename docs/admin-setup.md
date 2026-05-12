# Admin Setup

Raph's Market admin access uses Supabase Auth plus the `admin_profiles` table.

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

In Supabase Auth settings, add the app URLs used by local, preview, and production deployments:

- `http://localhost:3000`
- Vercel preview URL
- production domain

The current login form uses email/password auth and redirects the browser to `/admin` after a successful sign-in. Non-admin authenticated users are shown an access-denied state.

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is not used for the admin shell auth check. It remains server-only for seed scripts and protected server routes from earlier milestones.
