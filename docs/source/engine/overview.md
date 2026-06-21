# Engine overview

The Engine owns the API, run harness, scoring, policy, and wallet.

## Files

- `src/lib/types.ts` — §10 contracts + Zod schemas
- `src/lib/db.ts` — SQLite client (better-sqlite3, WAL mode)
- `src/lib/schema.ts` — DB schema initialization
- `src/lib/stripe.ts` — Stripe test client
- `src/lib/stripe-helpers.ts` — high-level Stripe ops (createCharge, refundCharge, createCustomer, verifyWebhookSignature)
- `src/lib/wallet.ts` — per-run wallet state machine (charge, payout, approval lifecycle, balance tracking)
- `src/lib/policy.ts` — policy evaluation (spend cap, allowlist, forbidden tools, approval threshold, violation logging)
- `src/lib/challenges.ts` — challenge lookup + AI Ops pack loader
- `src/data/challenges.ts` — the 6-challenge pack, contestants, and fixture data used by dev/UI routes
- `src/lib/harness.ts` — RunHarness: start/end runs, emit TraceEvents, enforce time+budget limits, replay, rank recomputation
- `src/lib/scoring.ts` — deterministic scoring engine (dimensions + weights, no LLM)
- `src/lib/seedable-rng.ts` — mulberry32 PRNG for deterministic replay
- `src/lib/trace-recorder.ts` — standardized TraceEvent builders with rubric_inputs slots
- `src/lib/contestant-runner.ts` — deterministic simulated contestant run generator (seedable, challenge-specific event templates)
- `src/lib/simulated.ts` — load simulated runs from JSON files on disk
- `src/lib/fixtures.ts` — §10 mock fixtures for dev/UI work
- `src/app/api/**/route.ts` — HTTP surface for the Engine

## Data flow

1. A `Challenge` is loaded from `src/lib/challenges.ts` (seeded from `src/data/challenges.ts`).
2. `RunHarness.startRun` writes a `Run` row to SQLite with an initial wallet.
3. Every agent action emits a `TraceEvent` via `RunHarness.emitTrace`.
4. Policy checks happen in `src/lib/policy.ts` before any charge/payout; failures are logged as `policy_violation` trace events.
5. Wallet balance changes go through `src/lib/wallet.ts` and produce a `Receipt`.
6. `RunHarness.enforceLimits` fails a run when time or balance hits zero.
7. On run end, `scoring.scoreRun` reads the full trace + receipts and emits a `ScoreResult`; ranks are recomputed per challenge.
8. Replay mode reads stored traces + receipts and re-emits them via `RunHarness.replayRun`.
9. Simulated contestants are generated deterministically with `contestant-runner.buildRun` (challenge-specific event templates, seeded RNG, rubric inputs per event).

## API routes

- `GET /api/health`
- `GET /api/challenges`
- `GET /api/leaderboard`
- `GET /api/runs`
- `GET /api/receipts`
- `POST /api/webhooks/stripe` — accepts Stripe test-mode webhooks (signature verification TODO; currently logs payload)

Each endpoint returns bodies that validate against the schemas in `src/lib/types.ts`.

## Modules

### RunHarness (`src/lib/harness.ts`)

Central orchestrator backed by SQLite.

- `startRun(challengeId, contestantId, live): Run` — inserts run row.
- `emitTrace(runId, type, summary, data): TraceEvent` — appends trace event with auto-incremented seq.
- `endRun(runId, status)` — finalizes run, runs scoring, stores score, recomputes ranks.
- `enforceLimits(runId)` — fails running runs past `time_limit_seconds` or with zero balance.
- `replayRun(runId, callbacks, speed)` — replays saved trace + receipt stream.
- `getRun / getTrace / getReceipts` — typed DB reads.

### Scoring engine (`src/lib/scoring.ts`)

Pure, deterministic, in-memory only.

- `scoreRun(run, challenge, traceEvents, receipts): ScoreResult`
- Dimensions: task_success (net_positive / status), money_left_cents, roi (payout/charge), quality (0.8 placeholder), time_seconds, policy_violations, auditability.
- Weighted total normalized to [0, 1].

### Policy engine (`src/lib/policy.ts`)

- `evaluatePolicy(policy, currentSpendCents, action): PolicyDecision`
- Rejects invalid amounts, spend-cap breaches, forbidden tools.
- Requires approval for actions >= `approval_threshold_cents`.
- In-memory approval lifecycle: `requestApproval` / `approveAction` / `rejectAction`.
- `logViolation(runId, violation)` — persists a `policy_violation` trace event.

### Wallet (`src/lib/wallet.ts`)

Stateful per-run wallet.

- `charge(...)` / `payout(...)` — evaluate policy, execute or pend approval.
- `approveAction` / `rejectAction` — complete or cancel pending items.
- `executeCharge` / `executePayout` — delegate to injected Stripe client, update balance, produce `Receipt`.

### Stripe helpers (`src/lib/stripe-helpers.ts`)

Thin wrappers around the Stripe test client:

- `createCharge`, `refundCharge`, `createCustomer`, `verifyWebhookSignature`

### Simulated contestants

- `src/lib/contestant-runner.ts:buildRun(plan): SimulatedRun` — generates a full Run + TraceEvent[] + Receipt[] + ScoreResult from a seed.
- `src/lib/simulated.ts` — loads runs previously serialized to `src/data/simulated/*.json`.
- `src/lib/seedable-rng.ts` — mulberry32 PRNG used by `contestant-runner`.
