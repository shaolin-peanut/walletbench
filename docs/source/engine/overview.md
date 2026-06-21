# Engine overview

The Engine owns the API, run harness, scoring, policy, and wallet.

## Files

- `src/lib/types.ts` — §10 contracts + Zod schemas
- `src/lib/db.ts` — SQLite client
- `src/lib/stripe.ts` — Stripe test client (read-only config; no network here by default)
- `src/lib/wallet.ts` — balance updates, charge/payout/refund ops
- `src/lib/policy.ts` — spend-cap + allowlist + approval checks
- `src/lib/schema.ts` — DB schema
- `src/data/challenges.ts` — the 6-challenge pack
- `src/app/api/**/route.ts` — HTTP surface

## Data flow

1. A `Challenge` is loaded from `src/data/challenges.ts`.
2. Policy checks happen in `src/lib/policy.ts` before any charge.
3. Wallet balance changes go through `src/lib/wallet.ts` and emit a `Receipt`.
4. Every agent action is appended as a `TraceEvent`.
5. Scoring reads the full trace + receipts and emits a `ScoreResult`.

## API routes

- `GET /api/health`
- `GET /api/challenges`
- `GET /api/leaderboard`
- `POST /api/runs`
- `GET /api/receipts`

Each endpoint returns bodies that validate against the schemas in `src/lib/types.ts`.
