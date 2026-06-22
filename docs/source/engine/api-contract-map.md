# Engine API contract map

Engine-owned routes live under `src/app/api/**/route.ts`. This map ties each route to the §10 schema it returns (or accepts), its backing module, and whether it currently serves fixture or live data.

> **Canonical shapes:** `src/lib/types.ts` (TS interfaces + Zod schemas).
> **Fixtures:** `src/lib/fixtures.ts`.
> **Live data modules:** `src/lib/db.ts`, `src/lib/wallet.ts`, `src/lib/scoring.ts`, `src/lib/challenges.ts`, `src/lib/policy.ts`, `src/lib/trace-recorder.ts`, `src/lib/stripe.ts`.

---

## Endpoints

### GET /api/health

| Field | Value |
|---|---|
| §10 schema | none (liveness probe) |
| In | — |
| Out | `{ status: string, service: string }` |
| Source module | `src/app/api/health/route.ts` |
| Fixture vs live | live |
| Notes | No DB/Stripe dependency. Use as deploy health check. |

Validation:
```bash
cd /home/ops/code/walletbench-engine && curl -s http://localhost:3000/api/health
# Expected: {"status":"ok","service":"walletbench"}
```

---

### GET /api/challenges

| Field | Value |
|---|---|
| §10 schema | `Challenge` §10.1 |
| In | — |
| Out | `Challenge[]` |
| Source module | `src/app/api/challenges/route.ts` → `src/lib/fixtures.ts` (TODO: E1 → `src/lib/challenges.ts`) |
| Fixture vs live | **fixture** |
| Notes | Returns assembly fixtures today. E1 will switch to DB-backed loader. |

Validation:
```bash
cd /home/ops/code/walletbench-engine && \
  curl -s http://localhost:3000/api/challenges | jq '.[0] | {id,title,budget_cents,currency}' && \
  npx tsx scripts/validate-types.ts
```

---

### GET /api/runs

| Field | Value |
|---|---|
| §10 schema | `Run` §10.3 |
| In | — |
| Out | `Run[]` |
| Source module | `src/app/api/runs/route.ts` → `src/lib/fixtures.ts` (TODO: E4 → `src/lib/db.ts`) |
| Fixture vs live | **fixture** |
| Notes | Trace events are not included here; they are retrieved per-run. |

Validation:
```bash
cd /home/ops/code/walletbench-engine && \
  curl -s http://localhost:3000/api/runs | jq '.[0] | {id,challenge_id,contestant_id,status,wallet}'
```

---

### GET /api/receipts

| Field | Value |
|---|---|
| §10 schema | `Receipt` §10.5 |
| In | — |
| Out | `Receipt[]` |
| Source module | `src/app/api/receipts/route.ts` → `src/lib/fixtures.ts` (TODO: E3 → `src/lib/wallet.ts`) |
| Fixture vs live | **fixture** |
| Notes | Vendored as a flat list for now. E3 will persist charge/payout/refund to SQLite. |

Validation:
```bash
cd /home/ops/code/walletbench-engine && \
  curl -s http://localhost:3000/api/receipts | jq '.[0] | {run_id,kind,amount_cents,currency,purpose,stripe_ref,balance_after_cents}'
```

---

### GET /api/leaderboard

| Field | Value |
|---|---|
| §10 schema | `ScoreResult` §10.6 |
| In | — |
| Out | `ScoreResult[]` |
| Source module | `src/app/api/leaderboard/route.ts` → `src/lib/fixtures.ts` (TODO: E5 → `src/lib/scoring.ts`) |
| Fixture vs live | **fixture** |
| Notes | Currently global. Post-E5 should filter by challenge or return ranked pack. |

Validation:
```bash
cd /home/ops/code/walletbench-engine && \
  curl -s http://localhost:3000/api/leaderboard | jq '.[0] | {run_id,challenge_id,contestant_id,total,rank}'
```

---

### POST /api/webhooks/stripe

| Field | Value |
|---|---|
| §10 schema | raw Stripe payload (accepted); no response schema enforced |
| In | Stripe event payload (JSON body) |
| Out | `{ received: boolean }` |
| Source module | `src/app/api/webhooks/stripe/route.ts` → `src/lib/stripe.ts` |
| Fixture vs live | **live** (test mode only) |
| Notes | Signature verification and wallet update are **TODO** (E3). Must remain behind one Stripe module for Reviewer. |

Validation:
```bash
cd /home/ops/code/walletbench-engine && \
  curl -s -X POST http://localhost:3000/api/webhooks/stripe \
    -H "content-type: application/json" \
    -d '{"type":"checkout.session.completed","id":"evt_test_123","data":{"object":{"id":"cs_test_123","payment_status":"paid"}}}'
# Expected: {"received":true}
```

---

### Write routes (missing today)

| Route | §10 schema | Notes |
|---|---|---|
| `POST /api/runs` | `Run` §10.3 + `TraceEvent` stream | **TODO** — needed by harness to spawn contestants |
| `POST /api/runs/:id/trace` | `TraceEvent` §10.4 | **TODO** — append-only trace ingestion |
| `POST /api/runs/:id/receipts` | `Receipt` §10.5 | **TODO** — wallet/Stripe layer emits after charges |
| `POST /api/runs/:id/score` | `ScoreResult` §10.6 | **TODO** — scoring engine endpoint |
| `POST /api/policy/check` | `PolicyDecision` §10.7 | **TODO** — pre-charge approval gate |

These routes should be owned by Engine. If any are surfaced in Surface code before implementation, mark them as fixture-backed stubs (follow-up from docs review `t_66bdd1a8`).

---

## Fixture vs live status overview

| Endpoint | Status | Owner task |
|---|---|---|
| `/api/health` | live | S2 |
| `/api/challenges` | fixture | E1 |
| `/api/runs` | fixture | E4 |
| `/api/receipts` | fixture | E3 |
| `/api/leaderboard` | fixture | E5 |
| `/api/webhooks/stripe` | live (partial) | E3 |

---

## Validation commands copy-paste index

```bash
cd /home/ops/code/walletbench-engine

# 1) Health
curl -s http://localhost:3000/api/health

# 2) Challenges
curl -s http://localhost:3000/api/challenges | jq '.[0] | {id,title,budget_cents,currency}'
npm run validate-types

# 3) Runs
curl -s http://localhost:3000/api/runs | jq '.[0] | {id,challenge_id,contestant_id,status,wallet}'

# 4) Receipts
curl -s http://localhost:3000/api/receipts | jq '.[0] | {run_id,kind,amount_cents,currency,purpose,stripe_ref,balance_after_cents}'

# 5) Leaderboard
curl -s http://localhost:3000/api/leaderboard | jq '.[0] | {run_id,challenge_id,contestant_id,total,rank}'

# 6) Stripe webhook (test)
curl -s -X POST http://localhost:3000/api/webhooks/stripe \
  -H "content-type: application/json" \
  -d '{"type":"checkout.session.completed","id":"evt_test_123","data":{"object":{"id":"cs_test_123","payment_status":"paid"}}}'
```
