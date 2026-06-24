# Surface — Route & User-Journey Map

Canonical map of every demo-critical Surface page: the user story it serves,
the data it reads, the §10 JSON contracts it renders, its loading / error states,
and whether it currently hits a live API or reads fixture / replay data.
Last updated: 2026-06-21 — Surface lane.

> **Legend**
> - `Fixture` — page reads deterministic mock data from `src/lib/fixtures.ts`.
> - `API` — page prefers `fetch('/api/...')` and falls back to fixtures if the
>   endpoint is unreachable (I1 behaviour).
> - `Replay` — deterministic re-render of pre-recorded trace events.

---

## User-journey flow (Samuel demo walkthrough)

Demo is driven from `/demo`, but for the full walkthrough show these routes in
order so the UI chain is visible:

1. **`/challenges`** — Samuel sees 6 challenge cards. Funnel eye to the amber
   "★ FLAGSHIP" card for "Fund Yourself" (the simplest scenario for evaluation).
2. **`/challenges/fund-yourself`** — Click into the flagship spec. Confirm the
   visible constraints: $25 spend cap, 30 min time limit, scoring weights.
3. **`/leaderboard`** — Back → leaderboard. Samuel sees three ranked "contestants"
   as score cards with metric bars. Explain these are §10.6 `ScoreResult` rows.
4. **`/runs/<run-id>` (trace page)** — Click into a run (`alpha-run` is the
   reliable fixture). Walk the colour-coded timeline outward from the header
   (wallet, elapsed time, status badge). Expand any "Data" button to expose
   §10.4 `TraceEvent` payloads.
5. **`/runs/<run-id>/receipts`** — Click "View Receipts" in the header. Samuel
   sees burn chart (Recharts) + ledger rows derived from §10.5 `Receipt`
   records, plus per-kind totals.

Quick one-liner: *"Open `/demo` for the restaged capture, or click through
/challenges → /leaderboard → /runs → /receipts to see the full evaluation
pipeline."*

---

## Route inventory

### `/` (Home)

| Field | Value |
|-------|-------|
| User story | Entry point — title + tagline; entry to the challenge browser. |
| Data dependencies | None (static). |
| §10 contracts displayed | None. |
| Loading / error states | None — pure server component, no async. |
| Fixture / API / Replay | **Static.** Both paths. |

Notes: Minimal landing. From `/challenges` the user clicks a card to inspect a
challenge spec.

---

### `/leaderboard`

| Field | Value |
|-------|-------|
| User story | Rank contestants by §10.6 `ScoreResult` total. |
| Data dependencies | `ScoreResult` rows — `run_id`, `challenge_id`, `contestant_id`, `dimensions`, `total`, `rank`. |
| §10 contracts displayed | §10.6 `ScoreResult` (all fields rendered via `LeaderboardCards`). Also reads `Challenge` and `Contestant` to humanise labels. |
| Loading / error states | `Loading leaderboard…` while `fetch('/api/leaderboard')` probes the endpoint; silent fallback to `fixtures.scoreResults` on failure. No explicit error UI — graceful degradation. |
| Fixture / API / Replay | **API preferred, Fixture fallback.** |

Source: `src/app/leaderboard/page.tsx`, `src/components/LeaderboardCards.tsx`.

---

### `/challenges`

| Field | Value |
|-------|-------|
| User story | Browse evaluation challenges; choose the flagship challenge. |
| Data dependencies | `Challenge` list — `id`, `title`, `goal`, `budget_cents`, `currency`, `allowed_tools`, `time_limit_seconds`, `scoring_weights`. |
| §10 contracts displayed | §10.1 `Challenge` (all card fields). §10.1.3 `ScoringWeights` rendered as bar chart. |
| Loading / error states | None — static client render of fixtures. |
| Fixture / API / Replay | **Fixture.** |

Notes: `fund-yourself` is highlighted amber as the flagship challenge. Clicking a
card navigates to `/challenges/[id]`.

Source: `src/app/challenges/page.tsx`.

---

### `/challenges/[id]`

| Field | Value |
|-------|-------|
| User story | Show a single challenge's full spec so Samuel knows what the agent is being asked to do. |
| Data dependencies | Single `Challenge` matching `params.id`. Also references `Challenge.policy` (spend cap, approval threshold, forbidden tools) and `Challenge.success_check`. |
| §10 contracts displayed | §10.1 `Challenge` (all fields). §10.1.1 `Policy` (spend cap, approval threshold, forbidden tools). §10.1.2 `SuccessCheck` (type + params JSON). §10.1.3 `ScoringWeights` (bar chart). |
| Loading / error states | Inline error: "Challenge not found" with link back to `/challenges`. No loading state. |
| Fixture / API / Replay | **Fixture.** |

Source: `src/app/challenges/[id]/page.tsx`.

---

### `/runs/[id]`

| Field | Value |
|-------|-------|
| User story | Inspect one agent run as a replayable trace timeline with wallet / time context. |
| Data dependencies | `Run` (live flag, wallet, status), `TraceEvent[]` (`run_id`, `seq`, `ts`, `type`, `summary`, `data`), `Contestant` (name), `Challenge` (title). |
| §10 contracts displayed | §10.3 `Run` (header), §10.4 `TraceEvent` (timeline), §10.2 `Contestant` (name), §10.1 `Challenge` (title). |
| Loading / error states | Inline error: "Run not found". No explicit loader; events hydrate instantly from fixture accessors. |
| Fixture / API / Replay | **Fixture / Replay.** Live runs auto-refresh every 1 s via `setInterval` polling `fixtures.getTraceEvents`. |

Notes: Header includes a `View Receipts` link to `/runs/[id]/receipts`.

Source: `src/app/runs/[id]/page.tsx`, `src/components/TracePanel.tsx` (replay variant at `/trace`).

---

### `/runs/[id]/receipts`

| Field | Value |
|-------|-------|
| User story | Inspect every wallet transaction for a run as a burn chart + ledger + card gallery. |
| Data dependencies | `Run` (wallet start/balance, currency), `Receipt[]` (`run_id`, `ts`, `kind`, `amount_cents`, `currency`, `purpose`, `stripe_ref`, `balance_after_cents`), `Contestant`, `Challenge`. |
| §10 contracts displayed | §10.5 `Receipt` (all fields rendered as cards + ledger rows). |
| Loading / error states | Inline error: "Run not found" with link back to leaderboard. No loader. |
| Fixture / API / Replay | **Fixture.** |

Notes: Ledger running balance is derived from `Receipt.balance_after_cents` so it
stays deterministic. `Receipt.stripe_ref` renders verbatim — in I1 this is
expected to become a live Stripe test reference.

Source: `src/app/runs/[id]/receipts/page.tsx`.

---

## Fixture-vs-API summary (I1 readiness)

| Route | Current default | Target I1 |
|-------|-----------------|-----------|
| `/` | Static | Static |
| `/leaderboard` | Fixture | API (`/api/leaderboard`) |
| `/challenges` | Fixture | API (`/api/challenges`) |
| `/challenges/[id]` | Fixture | API (`/api/challenges`) |
| `/runs/[id]` | Fixture | API (`/api/runs`) |
| `/runs/[id]/receipts` | Fixture | API (`/api/runs`, `/api/receipts`) |

Engine already exposes the matching endpoints under `src/app/api/`; the Surface
pages just need to replace `fixtures.xxx` with the parsed JSON responses.

## Contract coverage by route

| §10 contract | Routes that render it |
|-------------|-----------------------|
| §10.1 `Challenge` | `/challenges`, `/challenges/[id]`, `/runs/[id]` (header) |
| §10.1.1 `Policy` | `/challenges/[id]` |
| §10.1.2 `SuccessCheck` | `/challenges/[id]` |
| §10.1.3 `ScoringWeights` | `/challenges`, `/challenges/[id]` |
| §10.2 `Contestant` | `/runs/[id]` (header) |
| §10.3 `Run` | `/runs/[id]` (header), `/runs/[id]/receipts` (header) |
| §10.3 `Wallet` | `/runs/[id]`, `/runs/[id]/receipts` |
| §10.4 `TraceEvent` | `/runs/[id]`, `/trace` |
| §10.5 `Receipt` | `/runs/[id]/receipts` |
| §10.6 `ScoreResult` | `/leaderboard` |
| §10.7 `PolicyDecision` | Not surfaced in any current UI (future: live-run eval). |
