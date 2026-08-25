# RESET Clinic — CityHost deployment

## Runtime
- Node.js 20 or 22 LTS
- Production build: `npm run build`
- Start command: `npm start`
- Entry point: `server.js`
- CityHost injects `PORT`; the server supports both a Unix socket path and a numeric port.

## Storage
On Vercel, RESET Admin uses Vercel Blob as before.
On CityHost or another traditional Node.js host, the app automatically stores leads/admin/blog JSON data in a private persistent directory.

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

Add CRM / Google integration variables only when those integrations are used.

## First deployment

```bash
cd ~/www/<technical-domain-or-site-directory>
npm install
npm run build
npm start
```

For CityHost Hosting 2.0, enable Node.js in the panel first and use Node 20/22. Start/restart the app from the Node.js section after the build completes.

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

All non-canonical hosts are sent with `X-Robots-Tag: noindex, follow`, so the CityHost technical URL cannot compete with `resetclinic.org` during testing.

## DNS cutover
Only after the CityHost technical URL passes all checks:
1. add `resetclinic.org` and `www.resetclinic.org` to the CityHost site;
2. activate SSL;
3. map all required legacy URLs to 301 redirects;
4. change DNS;
5. verify canonical, sitemap, robots, booking/API, admin and redirects on the real domain;
6. keep the old deployment available briefly for rollback.
