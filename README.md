# RESET Clinic — Next.js SSR

Clean Next.js App Router migration of RESET Clinic. Production contains no PHP runtime, WordPress server, WordPress database, or CMS dependency. All eight public routes are server-rendered and visual assets are local.

## Development
```bash
npm install
npm run dev
```

The historical booking backend credential is intentionally not committed. Reconnect it server-side through the variables in `.env.example`.
