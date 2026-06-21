# WalletBench build status

Last updated: 2026-06-21.

## Done

- Repo scaffolded (Next.js + SQLite + Stripe test stub)
- §10 TypeScript types + Zod schemas in `src/lib/types.ts`
- 6-challenge pack + schema validation in `src/data/challenges.ts`
- Policy engine (cap, allowlist, approval, violations)
- Wallet + Stripe-test integration (charge/payout/refund → Receipt)
- Run harness (mock contestant runs produce Run + trace)
- Scoring engine (dimensions + weights)
- API endpoints for §10 reads/writes
- Leaderboard view on fixtures
- Trace timeline view on fixtures
- Receipts gallery + spend ledger
- Challenge browser
- Demo fixtures (alpha / beta / gamma trace dossiers)
- Scoring CLI (`scripts/wb-score.ts`) with deterministic output

## In flight

- Surface↔Engine integration (replace fixtures with live API)
- Fund Yourself live run end-to-end
- Demo/replay mode toggle
- Leaderboard drama (rank-change animations)

## Next

- Simulated traces for contestants 2–6
- Full end-to-end demo dry-run (§3.4)
- Demo script + capture + edit
- Submission checklist: video, Discord link, Typeform
