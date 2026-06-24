# Surface — Source Overview

WalletBench front-end (Next.js 14 App Router, TypeScript, Tailwind, Recharts).  
Builds strictly against the §10 JSON contracts in `src/lib/types.ts`. Pages
are split between API-backed fetches and fixture-backed rendering today;
replay and seed modes are first-class for trace and demo experiences.

## Stack & conventions

- **Framework:** Next.js 14 App Router (`src/app/**`)
- **Language:** TypeScript strict
- **Styling:** Tailwind CSS (dark theme: `bg-gray-950` / `text-gray-100`)
- **Charts:** Recharts (`AreaChart` burn chart in receipts)
- **Icons:** `lucide-react`
- **Validation:** Zod schemas in `src/lib/types.ts` mirror §10 shapes
- **Mock data:** `src/lib/fixtures.ts` — 6 challenges, 3 contestants, 3 runs,
  24 trace events, 9 receipts, 3 leaderboard rows, 1 policy decision
- **Replay/seed:** `src/lib/replay.ts` — deterministic replay engine consumed by
  `/runs/[id]` and `TracePanel` for replay/seed fallback.

## Pages

| Route | Purpose | Data path |
|---|---|---|
| `/` | App shell — title, tagline, counts, and navigation cards. | `fixtures` for counts and navigation metadata. |
| `/leaderboard` | Sorted leaderboard cards rendered from `ScoreResult` rows. | Fetches `/api/leaderboard` on mount; renders `fixtures.scoreResults` for demo cards. |
| `/challenges` | 6-challenge card grid; flagship (`fund-yourself`) highlighted amber. | Fetches `/api/challenges`. |
| `/challenges/[id]` | Full challenge spec: budget, time, tools, policy, success check, scoring weights. | Fetches `/api/challenges/[id]`. |
| `/runs` | Run index table (id, challenge, contestant, status, wallet, timestamps). | Renders `fixtures.runs`. |
| `/runs/[id]` | Per-run trace timeline with stats bar, color-coded events, expandable payload, wallet balance / elapsed time, and a **View Receipts** link. | Renders `fixtures.getRun`, `fixtures.getTraceEvents`, `fixtures.getReceipts`. Supports Live mode (1s polling of fixtures) and Replay mode (`startReplay` over seeded fixture data). |
| `/runs/[id]/receipts` | Run receipts + burn chart + ledger table. | Renders `fixtures.getRun`, `fixtures.getReceipts`, `fixtures.contestants`, `fixtures.challenges`. |
| `/trace` | Standalone trace timeline with deterministic replay controls (run filter, speed selector, play/pause/reset). | Renders `fixtures.traceEvents` via `TracePanel`. |
| `/receipts` | Standalone receipts gallery — cards grouped by contestant with score breakdown and line items. | Renders `fixtures.contestants`, `fixtures.receipts`, `fixtures.scoreResults` via `ReceiptsGallery`. |
| `/demo` | Restaged single-page demo capture layout (high-contrast black background) combining `LeaderboardCards`, `TracePanel`, and `ReceiptsGallery`. | Renders `fixtures.scoreResults`, `fixtures.traceEvents`, plus gallery component. |

## Components

| Component | File | Renders |
|---|---|---|
| `LeaderboardCards` | `src/components/LeaderboardCards.tsx` | 3-column card grid showing rank, initials avatar, efficiency/fit/compliance bars, and total score. |
| `TracePanel` | `src/components/TracePanel.tsx` | Replayable stream of `TraceEvent` rows with run filter, speed control, expandable JSON payload. Falls back to seeded fixture events when not provided externally. |
| `ReceiptsGallery` | `src/components/ReceiptsGallery.tsx` | One `ReceiptCard` per contestant, each showing score breakdown + line-item receipts, grouped from fixture data. |

## Data layer

- **`src/lib/types.ts`** — TypeScript interfaces + Zod schemas for all §10 types
  (`Challenge`, `Contestant`, `Run`, `TraceEvent`, `Receipt`,
  `ScoreResult`, `PolicyDecision`). Field names are frozen per the brief.
- **`src/lib/fixtures.ts`** — Mock arrays and accessors consumed by arena
  pages and demo/replay modes today. Designed so the page code can later swap
  `fixtures.xxx` for `fetch('/api/...')` with minimal churn.
- **`src/lib/replay.ts`** — Deterministic replay/seed engine for trace replay.
- **`src/lib/schema.ts`** — Re-exports / shared schema helpers.
- **`src/lib/challenges.ts`** — Challenge data helpers.
- **`src/lib/db.ts`** — SQLite state (Engine-owned).
- **`src/lib/wallet.ts`** — Wallet state helpers (Engine-owned).
- **`src/lib/policy.ts`** — Policy logic (Engine-owned).
- **`src/lib/stripe.ts`** — Stripe test-mode integration (Engine-owned).

## API integration points (Engine ↔ Surface seam)

All API routes are defined by Engine and consumed where the UI is already
API-backed:

- `GET /api/health` — app health.
- `GET /api/challenges` — challenge pack.
- `GET /api/challenges/[id]` — single challenge.
- `GET /api/leaderboard` — leaderboard rows.
- `GET /api/runs` — run list.
- `GET /api/runs/[id]` — single run.
- `GET /api/runs/[id]/trace` — run trace events.
- `GET /api/runs/[id]/receipts` — run receipts.
- `GET /api/receipts` — receipt list.
- `GET /api/policy/check` — policy decision.
- `POST /api/webhooks/stripe` — Stripe test-mode webhook.

Today, `/challenges`, `/challenges/[id]`, and `/leaderboard` fetch from these
endpoints. Arena and replay pages (`/runs`, `/runs/[id]`,
`/runs/[id]/receipts`, `/trace`, `/receipts`, `/demo`) render from fixtures
and seeded replay data while the Engine API is completed.

## Themes

- **Arena pages** (`/leaderboard`, `/runs`, `/runs/[id]`, `/runs/[id]/receipts`, `/trace`, `/receipts`, `/demo`):
  dark `gray-950` background, muted borders, accent colors per event kind.
- **Challenge browser** (`/challenges`, `/challenges/[id]`):
  light `gray-50` background for readability.
