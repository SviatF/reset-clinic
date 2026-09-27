# RESET Clinic — emergency Cloudflare Workers cutover

This project can be deployed to Cloudflare Workers without changing the current Next.js 15 application architecture.

## Build / deploy

Cloudflare Workers Builds:

- Build command: `npm run build:cf`
- Deploy command: `npm run deploy:cf`
- Root directory: repository root
- Production branch: `main`

The Cloudflare build uses OpenNext to produce `.open-next/` and Wrangler deploys `cloudflare-worker.mjs`.

## Required runtime variables / secrets

Copy the production values from the existing environment into the Cloudflare Worker runtime environment.

Required for admin/auth and lead persistence:

```env
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
LEAD_IP_SALT=
INTEGRATIONS_ENCRYPTION_KEY=
BLOB_READ_WRITE_TOKEN=
RESET_REQUIRE_PERSISTENT_STORE=1
```

Booking / Cliniccards:

```env
CLINIC_BOOKING_API_BASE=https://cliniccards.com/api
CLINIC_BOOKING_API_KEY=
CLINIC_BOOKING_HORIZON_DAYS=28
CLINIC_BOOKING_SLOT_MINUTES=30
CLINIC_BOOKING_MIN_LEAD_MINUTES=30
```

Lead Telegram:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

SEO automation:

```env
SEO_CRON_SECRET=
SEO_TELEGRAM_BOT_TOKEN=
SEO_TELEGRAM_CHAT_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:resetclinic.org
GA4_PROPERTY_ID=
```

Do not configure Telegram thread IDs when using ordinary separate groups without Topics.

## Persistent storage safety

Cloudflare Workers exposes an ephemeral virtual filesystem. The repo therefore sets `RESET_REQUIRE_PERSISTENT_STORE=1` in `wrangler.jsonc` and refuses to use filesystem storage when a persistent Blob token is missing.

For the emergency cutover, provide `BLOB_READ_WRITE_TOKEN` so leads, admin data, blog data, SEO snapshots and logs remain persistent. A native Cloudflare R2 migration can be done after traffic is restored.

## SEO cron

`wrangler.jsonc` schedules the Worker hourly (`0 * * * *`). The custom Worker calls both protected internal endpoints:

- `/api/cron/seo-sync/`
- `/api/cron/seo-report/`

The Next.js endpoints retain the existing Europe/Kyiv gates, so:

- the real GSC/GA4/indexing sync runs only at 00:00 Kyiv;
- the SEO Telegram report runs only at 10:00 Kyiv;
- same-day duplicate execution remains blocked by the existing automation state.

The old CityHost crontab is no longer needed after cutover.

## First deployment validation

Test the generated `*.workers.dev` URL before attaching the production domain:

- `/`
- `/services/`
- `/booking/`
- `/robots.txt`
- `/sitemap.xml`
- `/admin/login/`
- `/admin/seo/`
- one controlled lead submission
- one manual SEO sync
- one forced SEO Telegram report

## Production domain cutover

Only after the Workers preview passes validation:

1. Attach `resetclinic.org` to the Worker as a custom domain/route.
2. Attach `www.resetclinic.org` to the same Worker; existing middleware redirects it to the apex domain.
3. Confirm HTTPS.
4. Confirm `/robots.txt` and `/sitemap.xml` return the production domain.
5. Confirm admin/login and booking APIs.
6. Confirm lead storage and Telegram delivery.
7. Confirm the Cloudflare Cron Trigger appears in Worker settings.

Keep the old origin DNS values documented for rollback until the Workers deployment is verified.
