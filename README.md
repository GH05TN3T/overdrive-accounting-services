# Overdrive Accounting Services

React/Vite website with Cloudflare Worker APIs, D1 appointments, R2 client documents, and Cloudflare Access workspaces.

## Local development

```bash
pnpm install
pnpm dev
```

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
5. Create Cloudflare Access applications for `/admin*`, `/api/admin/*`, `/portal*`, and `/api/client/*`. Restrict the admin paths to the staff email list; client paths can use the approved client email policy.

The public appointment form writes to D1. Client documents are stored in the private R2 bucket. Staff use `/admin` to review appointments, change status, and manage documents. The dashboard polls for updates every 30 seconds and also has a manual refresh action.

## Cloudflare Pages

- Build command: `pnpm build`
- Output directory: `dist`
- Production branch: `main`
- Deploy command: `npx wrangler deploy`
