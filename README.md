# Overdrive Accounting Services

React/Vite website with a Supabase-powered appointment flow, client document portal, and admin dashboard.

## Local development

```bash
pnpm install
pnpm dev
```

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env`.
3. Add the project URL and anon key from **Project Settings > API**.
4. Run `supabase/schema.sql` in the Supabase SQL Editor.
5. Enable Email auth under **Authentication > Providers**.
6. Create the admin user under **Authentication > Users**.
7. Promote that user by running this in the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = 'AUTH_USER_UUID';
```

The public appointment form writes to `appointments`. Clients use `/portal` to sign in and upload files. Staff use `/admin` to review appointments and manage secure documents. Appointment and document changes are streamed to the admin dashboard with Supabase Realtime.

## Cloudflare Pages

- Build command: `pnpm build`
- Output directory: `dist`
- Production branch: `main`
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
