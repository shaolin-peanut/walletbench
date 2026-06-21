# WalletBench Docs Review Gate

Reviewed: 2026-06-21 by `wb-reviewer` for kanban task `t_66bdd1a8`.

## Sources inspected

Repo docs:

- `README.md`
- `README_SCORING.md`
- `AGENTS.md`
- `package.json`
- current `src/app/**` route structure and `scripts/**`

Vault/status docs, read-only:

- `WalletBench-Build-Brief.md`
- `projects/walletbench/index.md`
- `projects/walletbench/readme.md`
- `projects/walletbench/STATUS-REPORT.md`
- `projects/walletbench/status/latest.md`
- `projects/walletbench/strategy/gaps.md`
- `projects/walletbench/strategy/questions.md`
- `projects/walletbench/operations/team-communication.md`
- `projects/walletbench/sessions/2026-06-21.md`

## Current coherence findings

### What is working

- The vault has a useful project hub at `projects/walletbench/index.md` with links to overview, current status, strategy, operations, and session handoff.
- The master build brief has stable §10 JSON contracts; builders and reviewer have a clear source of truth for shape validation.
- `AGENTS.md` gives concise repo conventions that match the current stack: Next.js 14, TypeScript, Tailwind, SQLite, Stripe test mode.
- `README_SCORING.md` documents the deterministic scoring CLI well enough for a reviewer or producer to run compare mode without reading the implementation.
- Standup/status reports give Samuel a compact operational view of blocked/done/todo counts.

### Gaps / conflicts / sprawl

1. Repo README is too thin for Samuel or a judge-facing reviewer.
   - It does not link to `README_SCORING.md`, the build brief, or any docs index.
   - It lists only early scaffold files and omits current routes such as `/leaderboard`, `/challenges`, `/runs/[id]`, `/runs/[id]/receipts`, API endpoints, scoring scripts, and demo fixtures.
   - It says `fixtures.ts` is mock data that Surface builds on, but Integration I1 requires killing fixture-only UI paths.

2. There is no repo-local docs folder or architecture diagram.
   - The product is explainability-heavy, but the codebase has no quick diagram showing Challenge -> Run -> Trace/Receipt -> Score -> Leaderboard.
   - The vault brief has the architecture, but the repo should not depend on a private vault note for onboarding or submission review.

3. Status reports have duplication and stale/conflicting facts.
   - `projects/walletbench/status/latest.md` says 15/38 done, while `projects/walletbench/STATUS-REPORT.md` says 28/55 done one hour later. Both are discoverable from search, but only one is linked as Latest from the hub.
   - `projects/walletbench/strategy/gaps.md` says scoring_engine=NO and progress 0/0 even though the repo now has `README_SCORING.md` and `scripts/wb-score.ts` committed on main.
   - `sessions/2026-06-21.md` says Telegram reaches `coder` and wb gateways are not direct, while `operations/team-communication.md` says `wb-lead` now owns Telegram. That is explainable chronology, but readers need a clear "current state wins" convention.

4. API/data ownership is not documented in a contract map.
   - Current API routes still return `fixtures` for `/api/challenges`, `/api/runs`, `/api/receipts`, `/api/leaderboard`.
   - UI pages still import `fixtures` directly in multiple places, which is a concrete I1 risk.
   - There is no single matrix of endpoint -> §10 contract -> source module -> validation command -> live/fixture status.

5. Demo docs are not yet actionable for Producer.
   - The brief has a 90-second demo shape, and the strategy docs name demo gaps, but the repo lacks a storyboard/capture checklist tied to concrete routes, fixture seeds, and acceptance checks.

## Docs review checklist

Use this as the reviewer gate for future docs/coherence sweeps.

### A. Source-of-truth and freshness

- The README links to the build brief, docs index, scoring README, and current demo instructions.
- Any generated status report has an obvious timestamp and does not masquerade as the latest if a newer report exists.
- Vault notes that are chronological/session-specific say so; evergreen notes link to the current status source.
- Strategy/status facts match current repo reality where machine-checkable: scripts present, routes present, Git remote present/absent, branches merged/unmerged.

### B. Folder and navigation structure

- Repo has a `docs/README.md` index or equivalent map.
- Docs are grouped by audience: operator/Samuel, builder, reviewer, producer/judge.
- No isolated all-caps or duplicate status files without an index explaining which one is canonical.
- New docs link back to the repo README and avoid depending on private vault-only context.

### C. Contract and API traceability

- Each §10 contract has a TypeScript schema/type reference and at least one fixture or validation path.
- Each API endpoint lists response shape, source of data, and validation command.
- Any fixture/mock mode is explicitly labeled; demo/live paths are separately labeled.
- UI pages should fetch documented API endpoints unless intentionally in replay/fixture mode.

### D. Explainability for Samuel and judges

- There is one plain-English architecture diagram: Challenge -> Contestant/Wallet -> Trace/Receipt -> Score -> Leaderboard.
- There is one demo walkthrough that maps the §3.4 story beats to concrete pages/routes and data seeds.
- The README explains Stripe test mode safety, no live money, and hard spend caps.
- Screenshots/video instructions name exact pages and expected visible proof: leaderboard ROI, receipts, trace timeline, wallet balance.

### E. Operational quality

- All commands in docs have been run or clearly marked as pending credentials/human setup.
- Build/test/status commands are copy-pastable from `/home/ops/code/walletbench`.
- Docs state cleanup requirements for dev servers: `npx kill-port 3000 || true`.
- Docs do not ask Samuel to paste secrets in chat; they point to env files or credential storage.

## Recommended recurring cron

Yes: add a periodic docs coherence cron, but keep it lightweight and read-only by default.

Recommended owner: `wb-lead`, because it owns Samuel-facing status and already delivers standup/strategy pings. The reviewer should remain the verification gate for specific high-risk sweeps, not the noisy status bot.

Cadence during hackathon: every 12 hours until submission, then disable or reduce to daily.

What it should inspect:

1. Repo docs inventory:
   - `README.md`, `README_SCORING.md`, `AGENTS.md`, `docs/**/*.md`
   - route inventory under `src/app/**`
   - scripts inventory under `scripts/**`
2. Vault status inventory:
   - `projects/walletbench/index.md`
   - `projects/walletbench/status/latest.md`
   - `projects/walletbench/STATUS-REPORT.md` if it remains
   - `projects/walletbench/strategy/gaps.md`
   - `projects/walletbench/strategy/questions.md`
3. Machine checks:
   - `git status --short`
   - `git remote -v`
   - `git branch -vv`
   - `npm run validate-types`
   - `npm run wb-score -- compare demo/fixtures/alpha-seed.json demo/fixtures/beta-seed.json demo/fixtures/gamma-seed.json`
4. Report only these deltas:
   - stale status timestamps
   - contradictions between strategy docs and repo reality
   - new routes/scripts without docs links
   - README links that point nowhere
   - fixture-only UI/API paths that threaten I1/I4

The cron should create or suggest precise Kanban tasks rather than editing docs automatically, because docs changes affect multiple lanes and can hide product decisions.

## Improvement task recommendations

The reviewer created follow-up Kanban cards from this review for engine, surface, and producer. The main intended outcomes are:

- Engine: a contract/API map with source-of-data and validation commands.
- Surface: a UI route/user-journey map that exposes fixture-vs-API status.
- Producer: a demo storyboard/capture checklist tied to concrete routes and expected visible proof.
- Lead: a docs-coherence cron that reads repo+vault and pings only actionable contradictions.
