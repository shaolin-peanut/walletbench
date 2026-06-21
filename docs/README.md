# WalletBench Docs

Repo-local docs for building, reviewing, and demoing WalletBench.

## Current docs

- [Docs review gate](./DOCS_REVIEW.md) — coherence findings, recurring review checklist, and follow-up task recommendations.
- [Scoring CLI](../README_SCORING.md) — deterministic audit scoring runner and demo fixture usage.
- [Agent developer guide](../AGENTS.md) — stack conventions and repo DoD for coding agents.

## Source of truth order

1. `WalletBench-Build-Brief.md` in the shared vault — product strategy and frozen §10 contracts.
2. Repo code and schemas — current machine-checkable implementation.
3. Repo docs here — onboarding, review checklists, demo instructions.
4. Vault status reports — time-stamped operational snapshots, not evergreen implementation docs.

If these conflict, treat §10 contracts as fixed and create a Kanban follow-up instead of silently changing interfaces.
