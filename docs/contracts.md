# §10 Contracts (readable reference)

The fixed seams. If you need a new field, propose it to the Lead — do not diverge.

Source of truth: `WalletBench-Build-Brief.md` §10 and `src/lib/types.ts`.

## 1. Challenge

A declarative task spec.

- `id` — slug
- `title` — human name
- `goal` — one sentence
- `budget_cents` / `currency`
- `allowed_tools` + `forbidden_tools`
- `policy.spend_cap_cents`, `policy.approval_threshold_cents`
- `time_limit_seconds`
- `success_check` — type + params
- `scoring_weights` — 0..1 floats summing to 1

## 2. Contestant

An agent entered into a challenge.

- `id`, `name`, `kind` (`hermes_profile` or `external`), optional `endpoint`

## 3. Run

One execution of one contestant against one challenge.

- `id`, `challenge_id`, `contestant_id`
- `status` (`running` | `complete` | `failed`)
- `started_at`, `ended_at` (ISO8601; null while running)
- `wallet` — `start_cents`, `balance_cents`, `currency`
- `live` — boolean

## 4. TraceEvent

Append-only stream of what the agent did.

- `run_id`, `seq`, `ts` (ISO8601)
- `type` (`decision` | `tool_call` | `spend` | `artifact` | `policy_violation`)
- `summary` — human-readable one-liner
- `data` — `tool?`, `args?`, `result?`

## 5. Receipt

One per Stripe-test transaction.

- `run_id`, `ts`, `kind` (`charge` | `payout` | `refund`)
- `amount_cents`, `currency`, `purpose`
- `stripe_ref` (`pi_test_...`)
- `balance_after_cents`

## 6. ScoreResult

Multi-dimensional evaluation of a run.

- `run_id`, `challenge_id`, `contestant_id`
- `dimensions`:
  - `task_success` (0..100)
  - `money_left_cents`
  - `roi`
  - `quality` (0..1)
  - `time_seconds`
  - `policy_violations`
  - `auditability` (0..1)
- `total` (0..100), `rank`

## 7. PolicyDecision

Returned by the policy engine before any charge.

- `allowed`, `reason`, `requires_approval`
