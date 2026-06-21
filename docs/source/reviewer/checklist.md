# Reviewer checklist

Use this before any lane is marked Done.

## Contracts

- [ ] Every JSON body returned by an API route validates against the corresponding Zod schema in `src/lib/types.ts`.
- [ ] No field names diverge from §10 (check both TS interfaces and the brief).

## Engine

- [ ] Policy engine rejects a charge that would exceed the spend cap.
- [ ] Wallet emits a `Receipt` for every Stripe-test transaction.
- [ ] Run harness produces a `Run` and a stream of `TraceEvent`s.

## Surface

- [ ] Leaderboard renders `ScoreResult` rows and is sortable.
- [ ] Receipts gallery renders `Receipt` items with amount + purpose.
- [ ] Trace timeline shows interleaved events in `seq` order.

## Integration

- [ ] Health endpoint returns 200.
- [ ] End-to-end: create a run → see it on the leaderboard → view its trace + receipts.
- [ ] Fund Yourself challenge completes net-positive in Stripe test mode and produces ≥1 receipt.

## Tests

- [ ] `npm run build` passes.
- [ ] `npm test` passes.
- [ ] `npx tsx scripts/wb-score.ts demo/fixtures/alpha-seed.json` produces a deterministic score.
