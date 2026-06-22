# WalletBench architecture

Single-process Next.js app. Frontend and API share one repo, one SQLite database, and the same TypeScript types.

```
┌───────────────────────────────────────────────────────────┐
│  WalletBench (Next.js App Router)                          │
│                                                            │
│  Frontend (Surface)            API (Engine)                │
│  ┌──────────────┐             ┌─────────────────────────┐  │
│  │ leaderboard  │◄────JSON────▶ GET /api/leaderboard     │  │
│  │ trace-timeline│             └─────────────────────────┘  │
│  │ receipts     │             ┌─────────────────────────┐  │
│  │ challenges   │◄──────────▶ GET /api/challenges        │  │
│  │ run/[id]     │             ┌─────────────────────────┐  │
│  └──────────────┘             │ POST /api/runs           │  │
│                               │ req:  Challenge + Contestant│
│                               │ res:  Run + Trace stream   │  │
│                               └──────────┬──────────────┘  │
│                                          │                 │
│                            ┌─────────────▼───────────────┐│
│                            │  Engine modules             ││
│                            │  • challenge store          ││
│                            │  • policy engine            ││
│                            │  • wallet / Stripe (test)   ││
│                            │  • run harness              ││
│                            │  • scoring engine           ││
│                            └─────────────┬───────────────┘│
│                                          │                 │
│                            ┌─────────────▼───────────────┐│
│                            │  SQLite (better-sqlite3)    ││
│                            └─────────────────────────────┘│
└───────────────────────────────────────────────────────────┘
        ▲                              │
        │ spawn a contestant          │ spend → receipts
        │                              ▼
  Hermes profile / external        Stripe (TEST MODE)
  agent (trajectory trace)
```

## 5-beat demo narrative (§3.4 of the build brief)

```
BEAT 1  (0:00-0:15)  Cold open
    Show three wallets with balances. Killer line.
             │
BEAT 2  (0:15-0:55)  Live run
    Fund Yourself challenge runs live in Stripe test mode.
    Receipts appear in the gallery as spend happens.
    Other two contestants show pre-recorded traces.
             │
BEAT 3  (0:55-1:20)  Leaderboard
    Rank, ROI, money left, policy violations, artifacts.
             │
BEAT 4  (1:20-1:40)  Meta reveal
    The contestants are the same agents that built the arena.
             │
BEAT 5  (1:40-end)   Close
    One-line viability pitch + killer line again.
```

## Key constraints

- One repo, one runnable process. No external DB to provision.
- All spend is Stripe **test mode** — hard caps enforced before any charge.
- Builders work against `src/lib/types.ts` (the §10 contracts). They do not talk to each other; they talk to the schemas.
