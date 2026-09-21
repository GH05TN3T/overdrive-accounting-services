# Overdrive Accounting Services

React/Vite website with Cloudflare Worker APIs, D1 appointments, R2 client documents, and Cloudflare Access workspaces.

## Local development

```bash
pnpm install
pnpm dev
```

For local Worker/API development, copy `.dev.vars.example` to `.dev.vars` and run:

```bash
npx wrangler dev
```

`.dev.vars` is ignored by Git. Production deployments use Cloudflare Runtime secrets instead of a project `.env` file.

## Cloudflare setup

1. Create a D1 database:

```bash
npx wrangler d1 create overdrive-accounting
npx wrangler r2 bucket create overdrive-client-documents
```

2. Add the D1 `database_id` and R2 bucket binding from `cloudflare/wrangler.bindings.example.jsonc` to `wrangler.jsonc`.
3. Create the tables remotely:

```bash
npx wrangler d1 execute overdrive-accounting --remote --file=cloudflare/schema.sql
```

4. Set `ADMIN_EMAILS` in `wrangler.jsonc` to the email addresses allowed into the admin workspace.
5. Set the admin secrets. Do not commit these values:

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

6. Remove any Cloudflare Access applications protecting `/admin*` and `/api/admin/*`; the admin dashboard uses the Worker credentials above. Client portal routes can still use Access with `/portal*` and `/api/client/*`.
7. Create a Cloudflare Turnstile widget for the site hostname. Add its public site key as the Cloudflare build variable `VITE_TURNSTILE_SITE_KEY`, then add the secret key:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

The public appointment form writes to D1. Client documents are stored in the private R2 bucket. Staff use `/admin` to review appointments, change status, and manage documents. The dashboard polls for updates every 30 seconds and also has a manual refresh action.

## Cloudflare Pages

- Build command: `pnpm build`
- Output directory: `dist`
- Production branch: `main`
- Deploy command: `npx wrangler deploy`
- Build variable: `VITE_TURNSTILE_SITE_KEY`
