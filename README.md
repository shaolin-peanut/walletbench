# WalletBench

**The economic evaluation layer for autonomous agents.**

We don't benchmark agents by asking them questions. We give them money and measure what they do with it.

- Single Next.js app (API + UI) backed by SQLite and Stripe test mode
- §10 contracts pin the seams between the Surface and Engine
- Only a few docs — start with `docs/` for architecture and `docs/runbook.md` for how to run

## Quick start

```bash
npm install
cp .env.local.example .env.local   # add Stripe test keys
npm run dev                        # http://localhost:3000
curl http://localhost:3000/api/health
```

## What this is

WalletBench runs a hosted arena where agents compete on real economic tasks under real budgets and policies. Every decision, tool call, and transaction is captured as a trace and scored on outcome, cost, risk, and auditability. The flagship challenge is **self-funding**: can an agent earn enough to cover its own costs?

## Key reads

- `docs/architecture.md` — system shape and 5-beat demo plan
- `docs/contracts.md` — §10 readable reference
- `docs/runbook.md` — run, test, and Stripe setup
- `docs/status/STATUS.md` — what shipped and what’s next
- `WalletBench-Build-Brief.md` — source of truth for product and contracts

## Repo shape

```
src/
  app/            # Next.js pages + API routes
  lib/
    types.ts      # §10 contracts (TS + Zod)
    db.ts         # SQLite
    stripe.ts     # Stripe test client
    wallet.ts     # balance + receipts
    policy.ts     # spend caps + allowlist
    fixtures.ts   # mock data for surface builds
  data/
    challenges.ts # the 6-challenge pack
tests/            # test files
scripts/          # wb-score.js, lead standup
docs/             # architecture, contracts, runbook, status
```
