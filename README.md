# RESET Clinic — Next.js SSR

Production website implemented with Next.js App Router and server-side rendering.

## Run locally

```bash
npm install
npm run dev
```

## Production

```bash
npm install
npm run build
npm start
```

Public routes: `/`, `/price/`, `/doctors/`, `/contacts/`, `/about/`, `/services/`, `/thank-you/`, `/booking/`, `/blog/`.

## RESET Admin

`/admin/` is a private internal workspace for leads, CRM, CMS/blog, SEO auditing, Search Console and GA4.

The admin intentionally has no Supabase/database dependency:

- `ADMIN_USERNAME` + `ADMIN_PASSWORD` protect the workspace with an HMAC-signed HttpOnly session cookie.
- A private Vercel Blob store persists leads, CMS records and SEO/analytics JSON snapshots.
- Every accepted lead is saved first and then dispatched as JSON to the configured CRM webhook.
- `/admin/`, `/api/`, `/internal/` and `/preview/` are excluded from crawling and receive noindex/noarchive/no-store headers.

See `.env.example` for environment variables. No production secrets are committed.
