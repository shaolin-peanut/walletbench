# Surface overview

The Surface owns the UI. During early phases it renders against mock fixtures in `src/lib/fixtures.ts` so it does not depend on the Engine being live.

## Pages

- `src/app/page.tsx` — landing
- `src/app/leaderboard/page.tsx` — live leaderboard
- `src/app/challenges/page.tsx` — challenge pack browser
- `src/app/challenges/[id]/page.tsx` — single challenge detail
- `src/app/runs/[id]/page.tsx` — trace timeline + ledger
- `src/app/runs/[id]/receipts/page.tsx` — receipts gallery

## Conventions

- All UI state comes from API responses that match `src/lib/types.ts`.
- No direct DB access from components.
- Tailwind for styling; no component library.
