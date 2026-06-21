# wb-score — Audit Scoring CLI

A deterministic, schema-validated scoring runner for WalletBench exit interviews.
It ingests a self-contained trace dossier and produces a fixed rubric table ranked against the three auditable dimensions: cost-efficiency, product-fit, and compliance.

## Rubric

| Dimension | Weight | How it's measured |
|---|---|---|
| Cost-efficiency | 40% | Money utilization + ROI relative to budget. Rewards keeping funds while generating payouts. |
| Product-fit | 35% | Task success, artifact quality heuristic, and time efficiency. |
| Compliance | 25% | Policy violations + trace auditability (contiguity, timestamp validity). |

Each dimension is scored 0-100. Total is 0-100.

### Formulas

- task_success: `pass` → 100, `partial` → 50, `fail` → 0, derived from `challenge.success_check` and `run.wallet`.
- product-fit: `0.40 * task_success + 0.25 * quality + 0.35 * time_score`
  - time_score: `clamp(0, 100, 100 * (1 - elapsed_seconds / time_limit_seconds))`
  - quality: heuristic based on density of `artifact` trace events (`clamp(0, 1, (artifact_count / event_count) * 20)`)
- cost-efficiency: `0.50 * money_utilization + 0.50 * roi_score`
  - money_utilization: `clamp(0, 100, 100 * (balance_cents / start_cents))`
  - roi_score: `clamp(0, 100, 50 + 50 * roi)`
- compliance: `0.50 * (1 / (1 + policy_violations)) * 100 + 0.50 * auditability * 100`
  - auditability: fraction of trace events that are timestamp-valid and contiguously packed by `seq`.

The engine is pure TypeScript — no DB access, no LLM. See `scripts/wb-score.ts`.

## Usage

Single trace:

```bash
npx tsx scripts/wb-score.ts demo/fixtures/alpha-seed.json
```

Compare mode (alpha / beta / gamma from the same seed):

```bash
npx tsx scripts/wb-score.ts compare \
  demo/fixtures/alpha-seed.json \
  demo/fixtures/beta-seed.json \
  demo/fixtures/gamma-seed.json
```

## Example output

### Single trace

```
RUBRIC SCORE — wb-contestant-alpha
Challenge: Fund Yourself
Run:       run_alpha_demo

──────────────────────────────────────────────────────────────────
Dimension          Weight   Score
──────────────────────────────────────────────────────────────────
Cost-efficiency    40%      100/100
Product-fit        35%       66/100
Compliance         25%      100/100
──────────────────────────────────────────────────────────────────
TOTAL                        88/100
```

### Compare

```
COMPARE
──────────────────────────────────────────────────────────────────────────────
Rank  Contestant               Total   Cost-eff  Product-fit  Compliance
──────────────────────────────────────────────────────────────────────────────
   1  wb-contestant-alpha        88        100           66          100
   2  wb-contestant-beta         73         99           24          100
   3  wb-contestant-gamma        47         47           27           75
──────────────────────────────────────────────────────────────────────────────
WINNER: wb-contestant-alpha (88/100)
```

## Trace dossier schema

```jsonc
{
  "schema_version": "1.0",
  "run": {
    "id": "run_alpha_demo",
    "challenge_id": "fund-yourself",
    "contestant_id": "wb-contestant-alpha",
    "status": "complete",
    "started_at": "2026-06-21T16:00:00.000Z",
    "ended_at": "2026-06-21T16:08:00.000Z",
    "wallet": { "start_cents": 2500, "balance_cents": 2700, "currency": "usd" },
    "live": false
  },
  "challenge": { /* matches ChallengeSchema */ },
  "trace": [ /* matches TraceEventSchema[] */ ],
  "receipts": [ /* matches ReceiptSchema[] */ ]
}
```

The runner validates every layer against the Zod schemas used by the API and the engine branch, so invalid dosseirs will fail fast with a descriptive error.

## Notes

- The CLI is deterministic: identical inputs produce identical scores.
- The randomized judge placeholder used in the API does **not** affect `wb-score`; quality is derived from trace artifacts in the CLI tier.
- Provider/network changes do not influence the output because the engine reads only local JSON data.
