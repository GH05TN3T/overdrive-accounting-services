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

If the database already exists, also add the meeting fields:

```bash
npx wrangler d1 execute overdrive-accounting --remote --file=cloudflare/migrations/0002_meeting_fields.sql
```

4. Set `ADMIN_EMAILS` in `wrangler.jsonc` to the email addresses allowed into the admin workspace.
5. Set the admin secrets. Do not commit these values:

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

6. Remove any Cloudflare Access applications protecting `/admin*`, `/api/admin/*`, `/portal*`, and `/api/client/*`; admin and client workspaces use Worker credential sessions.
7. Create a Cloudflare Turnstile widget for the site hostname. Add its public site key as the Cloudflare build variable `VITE_TURNSTILE_SITE_KEY`, then add the secret key:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

8. Set up client email:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler d1 execute overdrive-accounting --remote --file=cloudflare/migrations/0003_client_messaging.sql
```

9. Enable client accounts:

```bash
npx wrangler d1 execute overdrive-accounting --remote --file=cloudflare/migrations/0004_client_accounts.sql
npx wrangler secret put CLIENT_SESSION_SECRET
```

10. Enable prepared client documents:

```bash
npx wrangler d1 execute overdrive-accounting --remote --file=cloudflare/migrations/0005_document_publishing.sql
```

Admins can upload tax, payroll, accounting, or other files as drafts and publish them from `/admin`. Clients only see published files in `/portal`.

11. Enable the client CRM checklist data:

```bash
npx wrangler d1 execute overdrive-accounting --remote --file=cloudflare/migrations/0006_client_crm.sql
```

The client workspace includes overview metrics, documents, appointments, secure messages, tax checklist, profile settings, and notifications based on unread activity.

Verify the domain in Resend and create a Cloudflare Email Routing rule for `Info@OverdriveAccountingServices.com` that sends to this Worker. Incoming messages are stored in D1 and appear under **Clients & inbox**. Outbound messages are sent through Resend.

The public appointment form writes to D1. Client documents are stored in the private R2 bucket. Staff use `/admin` to review appointments, change status, and manage documents. The dashboard polls for updates every 30 seconds and also has a manual refresh action.

## Security controls

- Turnstile is fail-closed in production when `TURNSTILE_SECRET_KEY` is missing.
- Worker rejects cross-origin state-changing API requests.
- Uploads are limited to approved document extensions and 25 MB.
- Private document responses use no-cache and `nosniff` headers.
- Add Cloudflare Rate Limiting rules for `/api/admin/login`, `/api/client/login`, `/api/client/register`, and `/api/appointments`.

## Cloudflare Pages

- Build command: `pnpm build`
- Output directory: `dist`
- Production branch: `main`
- Deploy command: `npx wrangler deploy`
- Build variable: `VITE_TURNSTILE_SITE_KEY`
