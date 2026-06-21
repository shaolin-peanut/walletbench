# WalletBench

Agent finance arena — watch wallets compete.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

## API health check

```bash
curl http://localhost:3000/api/health
```

## Environment

Copy `.env.local` and fill in Stripe test keys:

```bash
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Structure

```
src/
  app/               # Next.js App Router
    api/             # API routes
    page.tsx         # Landing
    layout.tsx       # Root layout
    globals.css      # Tailwind entry
  lib/
    types.ts         # §10 TypeScript contracts
    db.ts            # SQLite client
    stripe.ts        # Stripe test client
    fixtures.ts      # Mock data (Surface builds on this)
    utils.ts         # Tailwind helper
```

## Build tasks

See kanban board (`WB_BOARD=default`).
