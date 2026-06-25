# WalletBench — Agent Developer Guide

## Stack
- Next.js 14 App Router
- TypeScript (strict)
- Tailwind CSS
- SQLite (better-sqlite3) — WAL mode enabled
- Stripe test mode only

## Conventions
- All shared types in `src/lib/types.ts`
- All API routes in `src/app/api/**/route.ts`
- All DB logic in `src/lib/db.ts`
- All Stripe logic in `src/lib/stripe.ts`
- Use fixtures from `src/lib/fixtures.ts` for mock data

## Definition of Done
- Code compiles (`npm run build` passes)
- Health endpoint responds (`curl http://localhost:3000/api/health`)
- Changes committed to git
- Background processes killed before task completion

## PR Workflow

### Branch naming
Builders push to feature branches, **never directly to `main`**.
Format: `<scope>/<task-id>-<slug>`

Examples:
- `engine/E5a-scoring`
- `surface/U2-timeline`

Scopes expected by this repo:
- `engine` — backend, API, DB, Stripe, scoring, policy
- `surface` — frontend, UI, demo, routes
- `docs` — documentation only

### Opening a PR
1. Create a local feature branch.
2. Commit changes with clear messages.
3. Push the branch to the remote.
4. Open a PR targeting `main` from your feature branch.

You can open a PR via the GitHub web UI or with the API:

```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/shaolin-peanut/walletbench/pulls \
  -d '{
    "title": "engine/E5a-scoring: deterministic scoring",
    "head": "engine/E5a-scoring",
    "base": "main",
    "body": "Changes for task t_xxx.\n\n## Summary\n/detailed-summary\n\nFixes t_xxx"
  }'
```

Or with `gh` if installed:
```bash
gh pr create --base main --head engine/E5a-scoring \
  --title "engine/E5a-scoring: deterministic scoring" \
  --body "Changes for task t_xxx."
```

### Review and merge
- One reviewer checks: build clean, tests pass, DoD met, description references the task ID.
- Integrator merges to `main` only after approval.
- Prefer squash merge or rebase to keep history readable.
