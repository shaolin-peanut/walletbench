# Reviewer checklist

Gate before any lane reaches Done.

## Contracts

- [ ] `npm run validate-types` passes (7/7 §10 types).
- [ ] API route responses match the TS interfaces in `src/lib/types.ts` (field names and casing identical to §10).
- [ ] New fixtures or seed data parse against the corresponding Zod schema.

## Engine

- [ ] `tests/policy-integration.test.ts` passes (6/6): over-cap rejects, forbidden-tool rejects, approval-threshold gates, exact-cap rejects.
- [ ] `tests/wallet.test.ts` passes (6/6): forbidden tool blocked before Stripe call, threshold requires approval, approved pending executes, rejected pending removes.
- [ ] Run data uses `Run`, `TraceEvent`, and `Receipt` shapes from §10.

## Surface

- [ ] `/leaderboard` renders `ScoreResult` rows and is sortable on: rank, contestant name, ROI, money left, policy violations, total score.
- [ ] `/runs/[id]` trace timeline renders all §10.4 event types (`decision`, `tool_call`, `spend`, `artifact`, `policy_violation`) in `seq` order.
- [ ] `/runs/[id]/receipts` renders `Receipt` cards showing amount, purpose, stripe_ref, and balance.

## Integration

- [ ] `curl -s http://localhost:3000/api/health` returns `{ "status": "ok", "service": "walletbench" }`.
- [ ] `npm run build` passes.
- [ ] `npm test` passes (18/18).
- [ ] `npx tsx scripts/wb-score.ts demo/fixtures/alpha-seed.json` completes and prints a score.
- [ ] All six API routes resolve without 500 during local smoke test:
  - `GET /api/challenges`
  - `GET /api/health`
  - `GET /api/leaderboard?challenge_id=fund-yourself`
  - `GET /api/receipts?run_id=run_001`
  - `GET /api/runs`
  - `POST /api/webhooks/stripe` (returns `{ received: true }`)

## Seam / Endpoint checklist

- [ ] No new `src/app/api/**/route.ts` introduced without a corresponding type/interface in `src/lib/types.ts`.
- [ ] Any new UI page under `src/app/` that consumes API data has a matching API route listed above.
- [ ] If a new demuxed subdirectory exists under `src/app/runs/[id]/`, it is listed here and smoke-checked.
