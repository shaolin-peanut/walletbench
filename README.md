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
  lib/
    types.ts         # §10 TypeScript contracts
    fixtures.ts      # Mock data (Surface builds on this)
docs/
  source/surface/route-map.md  # Page-by-page journey and fixture-vs-API status
```

## Docs

- `docs/README.md` — Lane overview.
- `docs/source/surface/route-map.md` — 📋 Route map, user story, §10 contract coverage, and I1 data-source plan.

## Build tasks

See kanban board (`WB_BOARD=default`).

## Deployment

This app is configured for **Railway** (container deployment). Railway is chosen because `better-sqlite3` requires a writable filesystem and native Node.js addon support, which Railway provides. Vercel serverless is **not recommended** for this stack.

### Minimum environment variables

| Variable | Purpose |
|---|---|
| `DB_PATH` | Writable SQLite path. In Railway: `/app/data/walletbench.db`. |
| `STRIPE_TEST_SECRET_KEY` | Stripe test secret key. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key for the browser. |
| `NODE_ENV` | `production`. |

### Railway setup

1. Create a Railway project and connect this repo.
2. Set the build target to the included `Dockerfile` (Railway auto-detects `railway.json`).
3. Mount a persistent volume at `/app/data` so the SQLite database survives restarts.
4. Add the environment variables above in the Railway dashboard Variables tab.
5. Deploy. Railway exposes a public URL automatically.

### Vercel note

Do not deploy to Vercel without replacing `better-sqlite3` with a serverless-compatible datastore (e.g., Turso, PlanetScale, or Postgres). The current default `DB_PATH=./walletbench.db` also expects a writable filesystem.

### One-click local build

```bash
cp .env.example .env.local   # fill in test Stripe keys
npm install
npm run build
npm run start               # http://localhost:3000
```
