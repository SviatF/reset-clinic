# RESET Clinic — CityHost deployment

## Runtime
- Node.js 20 or 22 LTS
- Production build: `npm run build`
- Start command: `npm start`
- Entry point: `server.js`
- CityHost injects `PORT`; the server supports both a Unix socket path and a numeric port.

## Storage
On Vercel, RESET Admin uses Vercel Blob as before.
On CityHost or another traditional Node.js host, the app automatically stores leads/admin/blog/SEO JSON data in a private persistent directory.

Recommended production value:

```env
RESET_DATA_DIR=/home/<cityhost-user>/reset-data
```

Do not place this directory inside `public/`.

## Environment
Create `.env.production.local` on the server and configure at least:

```env
ADMIN_USERNAME=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
LEAD_IP_SALT=
INTEGRATIONS_ENCRYPTION_KEY=
RESET_DATA_DIR=
```

For the SEO Command Center automation also configure:

```env
SEO_CRON_SECRET=<long-random-secret>
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://resetclinic.org/
GA4_PROPERTY_ID=
```

SEO Telegram reporting reuses `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` and optional `TELEGRAM_MESSAGE_THREAD_ID` by default. To send SEO reports to another bot/chat, set `SEO_TELEGRAM_BOT_TOKEN`, `SEO_TELEGRAM_CHAT_ID` and optional `SEO_TELEGRAM_MESSAGE_THREAD_ID`.

## First deployment

```bash
cd ~/www/<technical-domain-or-site-directory>
npm install
npm run build
npm start
```

For CityHost Hosting 2.0, enable Node.js in the panel first and use Node 20/22. Start/restart the app from the Node.js section after the build completes.

## SEO cron jobs

The app checks `Europe/Kyiv` itself, so the safest setup is to call both protected endpoints once every hour. This avoids DST/server-timezone drift. Only one real sync/report is executed per Kyiv day.

Use CityHost Cron with these hourly commands (replace the secret with the same `SEO_CRON_SECRET` from `.env.production.local`):

```bash
curl -fsS -H 'Authorization: Bearer YOUR_SEO_CRON_SECRET' https://resetclinic.org/api/cron/seo-sync >/dev/null 2>&1
```

```bash
curl -fsS -H 'Authorization: Bearer YOUR_SEO_CRON_SECRET' https://resetclinic.org/api/cron/seo-report >/dev/null 2>&1
```

Recommended cron schedule for both: `0 * * * *`.

- `/api/cron/seo-sync` actually runs only at 00:00 Europe/Kyiv and refreshes a 90-day GSC/GA4 window plus URL Inspection.
- `/api/cron/seo-report` actually sends only at 10:00 Europe/Kyiv and reports the previous Kyiv day.
- Both endpoints are idempotent for the same scheduled day and protected by `SEO_CRON_SECRET`.

For a controlled manual test after deployment, append `?force=1` while still sending the Authorization header.

## Verification before DNS cutover
Verify the technical CityHost URL first:
- `/`
- `/cosmetology/`
- `/cosmetology/hardware/ipl/`
- `/booking/`
- `/api/leads` by a controlled test submission
- `/robots.txt`
- `/sitemap.xml`
- `/admin/login/`
- `/admin/seo/`

All non-canonical hosts are sent with `X-Robots-Tag: noindex, follow`, so the CityHost technical URL cannot compete with `resetclinic.org` during testing.

## DNS cutover
Only after the CityHost technical URL passes all checks:
1. add `resetclinic.org` and `www.resetclinic.org` to the CityHost site;
2. activate SSL;
3. map all required legacy URLs to 301 redirects;
4. change DNS;
5. verify canonical, sitemap, robots, booking/API, admin and redirects on the real domain;
6. keep the old deployment available briefly for rollback.
