# RESET Clinic — Next.js SSR

Production website implemented with Next.js App Router and server-side rendering.

## Run locally

```bash
npm ci
npm run dev
```

## Production

```bash
npm ci
npm run build
npm start
```

Public routes: `/`, `/price/`, `/doctors/`, `/contacts/`, `/about/`, `/services/`, `/thank-you/`, `/booking/`.

Booking backend secrets are not committed. Configure server-side variables from `.env.example` when the booking integration is connected.
