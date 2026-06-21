# Agent Instructions — WalletBench

> Read this on every task start. Violations block integration.

## 1. Project conventions

- **Language:** TypeScript strict (`strict: true` in `tsconfig.json`).
- **Framework:** Next.js 15 App Router.
- **Styling:** Tailwind CSS. Use `cn()` from `src/lib/utils.ts` for conditional classes.
- **Database:** SQLite via `better-sqlite3` (WAL mode enabled in `src/lib/db.ts`).
- **Payments:** Stripe test mode only. Never use live keys.
- **API routes:** Use App Router (`src/app/api/<route>/route.ts`). Return `NextResponse.json()`.
- **Types:** All domain types live in `src/lib/types.ts`. Never invent new shapes — extend existing interfaces.

## 2. Definition of done (all tasks)

Before calling `kanban_complete`, verify:

1. **Build passes:** `npm run build` exits 0.
2. **Health check passes:** `curl http://localhost:3000/api/health` returns 200.
3. **No background processes left:** If you started `npm run dev`, kill it before completing.
4. **Git committed:** `git add -A && git commit -m "<task-id>: <description>"`.
5. **Types consistent:** `npx tsc --noEmit` exits 0 (if you changed types).

## 3. Surface ↔ Engine contract

- Surface (UI) reads from API routes under `/api/*`.
- During U1–U4, API routes return `fixtures.ts` data.
- During I1, API routes switch to real DB queries.
- Surface never imports from `better-sqlite3` or `stripe` directly.

## 4. Stripe safety

- All Stripe calls use the test client in `src/lib/stripe.ts`.
- Check `isStripeReady()` before any Stripe operation. If false, log a clear error.
- Use idempotency keys for all mutable Stripe operations.
- Store `stripeRef` on every `Receipt`.

## 5. Background process hygiene

```bash
# Always run this before starting a dev server in a new task
npx kill-port 3000 || true
```

## 6. Fixture data

- `src/lib/fixtures.ts` contains mock data for all §10 schemas.
- Surface builds views against fixtures first (U1–U4).
- Engine replaces fixtures with real DB data during I1.
- Never delete fixture shapes — only replace content.

## 7. Contestant spawning (Engine only)

- Use `delegate_task` or `terminal` to spawn contestant agents.
- Contestant profiles: `wb-contestant-alpha`, `wb-contestant-beta`, `wb-contestant-gamma`.
- Inject wallet, goals, and policies via environment variables or stdin.
- Capture all TraceEvents to the runs table.

## 8. Communication

- If blocked on a human question, call `kanban_block` with the question.
- Do not stall silently.
- If a dependency task is incomplete, call `kanban_comment` on your task explaining what you need.

## 9. File ownership

| Path | Owner |
|------|-------|
| `src/lib/types.ts` | Surface + Engine (agree on shape) |
| `src/lib/db.ts` | Engine |
| `src/lib/stripe.ts` | Engine |
| `src/lib/fixtures.ts` | Surface (initially), then Reviewer |
| `src/app/api/*` | Engine |
| `src/app/page.tsx` | Surface |
| `src/app/*` | Surface |
| `scripts/capture-demo.js` | Producer |

## 10. Testing philosophy

- Every API route must have a corresponding `curl` or test script.
- Every UI view must render without errors on `npm run build`.
- Integration tasks (I1, I4) must verify end-to-end flows in a browser.
