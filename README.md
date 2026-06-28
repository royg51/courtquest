# 🎾 CourtQuest

CourtQuest is a full-stack tournament management platform for creating, managing, and running competitive sports brackets with real-time updates, payments, and authentication.

Built with **Next.js 14 (App Router)**, **Prisma**, **NextAuth.js**, and **Stripe**.

---

## Features

- 🏆 Tournament creation & bracket generation
- 👥 Team registration & management
- 📊 Live match scoring system
- 🔐 Authentication (NextAuth.js)
- 💳 Payments (Stripe)
- 📧 Email notifications (Resend)
- ⚡ Modern UI with Tailwind + Radix UI
- 📈 React Query for server state
- 🚨 Error monitoring (Sentry) & privacy-conscious analytics (Plausible)

---

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma ORM (PostgreSQL via Supabase)
- NextAuth.js v5 (Auth)
- Stripe (Payments)
- Resend (Email)
- Tailwind CSS + Radix UI
- React Query
- Sentry (errors) · Plausible (analytics) · Upstash Redis (rate limiting)

---

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/courtquest.git
cd courtquest
npm install
cp .env.example .env.local   # fill in real values — see Environment Variables below
npm run db:push              # sync the Prisma schema to your database
npm run dev
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full list with explanations. Summary by service:

| Service | Required? | Variables |
|---|---|---|
| Database (Supabase Postgres) | Yes | `DATABASE_URL`, `DIRECT_URL` |
| Auth.js | Yes | `AUTH_SECRET`, `AUTH_URL` |
| Google OAuth | Optional | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| Stripe | Optional (payments disabled without it) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Resend (email) | Optional (emails no-op without it) | `RESEND_API_KEY`, `EMAIL_FROM` |
| App | Yes | `NEXT_PUBLIC_APP_URL` |
| Admin bootstrap | Optional | `ADMIN_EMAILS` |
| Rate limiting (Upstash) | Recommended in prod | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Sentry | Optional (no-op without it) | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` |
| Plausible | Optional (no-op without it) | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` |

Every "optional" integration above is designed to degrade gracefully (skipped, logged, or a 503 on the specific feature) rather than crash the app when its env vars are absent — this is true in both local dev and production.

---

## Deploying to Vercel

No `vercel.json` is needed — Vercel auto-detects Next.js and handles the build/output configuration; the only Vercel-specific addition in this repo is `"postinstall": "prisma generate"` in `package.json`, which Vercel runs automatically before `next build` so the generated Prisma Client is always in sync with `prisma/schema.prisma`.

### Pre-deployment checklist

- [ ] All required env vars (table above) are set in Vercel → Project → Settings → Environment Variables, scoped correctly across Production / Preview / Development
- [ ] `DATABASE_URL` uses the **pooled** connection string (port 6543) and `DIRECT_URL` uses the **direct** one (port 5432) — required for Prisma to work correctly against Supabase's connection pooler on serverless
- [ ] `AUTH_URL` and `NEXT_PUBLIC_APP_URL` are set to the real production domain (not `localhost`)
- [ ] Stripe webhook endpoint is registered in the Stripe Dashboard pointing at `https://<your-domain>/api/webhooks/stripe`, and `STRIPE_WEBHOOK_SECRET` matches that endpoint's signing secret
- [ ] Stripe keys are **live** mode keys if this is a real production deploy (not `sk_test_…`/`pk_test_…`)
- [ ] Resend sending domain is verified in the Resend dashboard — unverified domains silently fail every send (see Known Issues below)
- [ ] Upstash Redis database created and its REST URL/token set, if you want rate limiting to actually work across multiple serverless instances (without it, rate limiting silently falls back to a per-instance in-memory counter — not safe for production traffic)
- [ ] `npm run build` succeeds locally against the same `DATABASE_URL` you're deploying with
- [ ] Preview deployments are enabled (default when the GitHub repo is connected to a Vercel project) — every PR gets its own preview URL automatically

### Post-deployment checklist

- [ ] Visit the deployed site; confirm the homepage and `/events` load without errors
- [ ] Sign up a real test account; confirm login/logout works
- [ ] Confirm `/robots.txt` and `/sitemap.xml` resolve and reference the production domain, not `localhost`
- [ ] Trigger a Stripe test payment (test mode) or a real low-value live payment, and confirm the webhook fires (`Stripe Dashboard → Webhooks → [endpoint] → recent deliveries` should show `200`)
- [ ] Confirm Sentry is receiving events (trigger a test error, check the Sentry project dashboard) if configured
- [ ] Confirm response headers include `Content-Security-Policy`, `X-Frame-Options`, etc. (`curl -I https://<your-domain>`)
- [ ] Spot-check `/admin` is unreachable for a non-admin account and redirects correctly for a logged-out visitor
