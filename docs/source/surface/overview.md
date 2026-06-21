# Surface — Source Overview

WalletBench front-end (Next.js 14 App Router, TypeScript, Tailwind, Recharts).  
Builds strictly against the §10 JSON contracts in `src/lib/types.ts`. Early
routes render against `src/lib/fixtures.ts` so the UI is usable before the
Engine API is wired.

## Stack & conventions

- **Framework:** Next.js 14 App Router (`src/app/**`)
- **Language:** TypeScript strict
- **Styling:** Tailwind CSS (dark theme: `bg-gray-950` / `text-gray-100`)
- **Charts:** Recharts (`AreaChart` burn chart in receipts)
- **Icons:** `lucide-react`
- **Validation:** Zod schemas in `src/lib/types.ts` mirror §10 shapes
- **Mock data:** `src/lib/fixtures.ts` — 6 challenges, 3 contestants, 3 runs,
  24 trace events, 9 receipts, 3 leaderboard rows, 1 policy decision

## Pages

| Route | Purpose | Fixture / API data |
|---|---|---|
| `/` | Minimal landing — title + tagline. | — |
| `/leaderboard` | Sorted leaderboard cards rendered from `ScoreResult` rows. | Loads `/api/leaderboard`; uses `fixtures.scoreResults` for cards. |
| `/challenges` | 6-challenge card grid; flagship (`fund-yourself`) highlighted amber. | `fixtures.challenges`. |
| `/challenges/[id]` | Full challenge spec: budget, time, tools, policy, success check, scoring weights. | `fixtures.challenges.find(...)`. |
| `/runs/[id]` | Per-run trace timeline with stats bar, color-coded events, expandable payload, wallet balance / elapsed time, and a **View Receipts** link. Live runs auto-refresh every 1s. | `fixtures.getRun`, `fixtures.getTraceEvents`, `fixtures.contestants`, `fixtures.challenges`. |
| `/runs/[id]/receipts` | Run receipts + burn chart + ledger table. | `fixtures.getRun`, `fixtures.getReceipts`, `fixtures.contestants`, `fixtures.challenges`. |
| `/trace` | Standalone trace timeline with deterministic replay controls (run filter, speed selector, play/pause/reset). | `fixtures.traceEvents` via `TracePanel`. |
| `/receipts` | Standalone receipts gallery — cards grouped by contestant with score breakdown and line items. | `fixtures.contestants`, `fixtures.receipts`, `fixtures.scoreResults` via `ReceiptsGallery`. |
| `/demo` | Restaged single-page demo capture layout (high-contrast black background) combining `LeaderboardCards`, `TracePanel`, and `ReceiptsGallery`. | `fixtures.scoreResults`, `fixtures.traceEvents`, plus gallery component. |

## Components

| Component | File | Renders |
|---|---|---|
| `LeaderboardCards` | `src/components/LeaderboardCards.tsx` | 3-column card grid showing rank, initials avatar, efficiency/fit/compliance bars, and total score. |
| `TracePanel` | `src/components/TracePanel.tsx` | Replayable stream of `TraceEvent` rows with run filter, speed control, expandable JSON payload. |
| `ReceiptsGallery` | `src/components/ReceiptsGallery.tsx` | One `ReceiptCard` per contestant, each showing score breakdown + line-item receipts. |

## Data layer

- **`src/lib/types.ts`** — TypeScript interfaces + Zod schemas for all §10 types
  (`Challenge`, `Contestant`, `Run`, `TraceEvent`, `Receipt`,
  `ScoreResult`, `PolicyDecision`). Field names are frozen per the brief.
- **`src/lib/fixtures.ts`** — Mock arrays and accessors consumed by every
  early-phase route. Designed so the page code can later swap
  `fixtures.xxx` for `fetch('/api/...')` with minimal churn.
- **`src/lib/schema.ts`** — Re-exports / shared schema helpers.
- **`src/lib/challenges.ts`** — Challenge data helpers.
- **`src/lib/db.ts`** — SQLite state (Engine-owned).
- **`src/lib/wallet.ts`** — Wallet state helpers (Engine-owned).
- **`src/lib/policy.ts`** — Policy logic (Engine-owned).
- **`src/lib/stripe.ts`** — Stripe test-mode integration (Engine-owned).

## API integration points (Engine ↔ Surface seam)

All API routes are defined by Engine but consumed here during I1:

- `GET /api/health` — app health.
- `GET /api/challenges` — challenge pack.
- `GET /api/leaderboard` — leaderboard rows.
- `GET /api/receipts` — receipt list.
- `GET /api/runs` — run list / detail.
- `POST /api/webhooks/stripe` — Stripe test-mode webhook.

During the fixture phase, these endpoints are not required for the UI to render;
Surface pages gracefully fall back to `fixtures.*` when API calls fail.

## Themes

- **Arena pages** (`/leaderboard`, `/runs/[id]`, `/trace`, `/receipts`, `/demo`):
  dark `gray-950` background, muted borders, accent colors per event kind.
- **Challenge browser** (`/challenges`, `/challenges/[id]`):
  light `gray-50` background for readability.
