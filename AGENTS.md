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
