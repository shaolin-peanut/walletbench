# WalletBench Frontend QA Audit Report

**Date:** 2026-06-22  
**Auditor:** Automated static code analysis + Playwright audit script  
**App URL:** http://localhost:3939  
**Methodology:** Full source code review of all 8 pages, 3 shared components, layout, CSS, fixtures, and data types.

---

## Executive Summary

The WalletBench frontend has **2 critical, 4 high, 8 medium, and 6 low** severity issues. The most impactful problems are: (1) key pages (challenges, runs) are unreachable from navigation, (2) inconsistent dark/light theming across pages, and (3) a receipt sign-convention bug that displays charges as `+` instead of `-`.

---

## Screenshot Audit

A Playwright audit script has been written to `scripts/qa-audit.js`. Run it with:

```bash
cd /home/ops/code/walletbench-surface
npx playwright install chromium
BASE_URL=http://localhost:3939 node scripts/qa-audit.js
```

Screenshots will be saved to `qa-screenshots/`:

| Page | Screenshot Path |
|------|----------------|
| Home (`/`) | `qa-screenshots/home.png` |
| Leaderboard (`/leaderboard`) | `qa-screenshots/leaderboard.png` |
| Challenges (`/challenges`) | `qa-screenshots/challenges.png` |
| Challenge Detail (`/challenges/fund-yourself`) | `qa-screenshots/challenge-fund-yourself.png` |
| Run Detail (`/runs/run_001`) | `qa-screenshots/run-detail.png` |
| Run Receipts (`/runs/run_001/receipts`) | `qa-screenshots/run-receipts.png` |
| Receipts (`/receipts`) | `qa-screenshots/receipts.png` |
| Trace (`/trace`) | `qa-screenshots/trace.png` |
| Demo (`/demo`) | `qa-screenshots/demo.png` |
| 404 /runs index | `qa-screenshots/404-runs-index.png` |
| Mobile (home) | `qa-screenshots/home-mobile.png` |
| Mobile (leaderboard) | `qa-screenshots/leaderboard-mobile.png` |

---

## Per-Page Analysis

### 1. Home (`/`)

**Source:** `src/app/page.tsx`

| Severity | Issue | Detail |
|----------|-------|--------|
| **HIGH** | Page is extremely sparse | Only an `<h1>` and `<p>` tag with `p-24` padding. No navigation cards, CTA buttons, quick stats, or links to challenges/leaderboard. Not a functional landing page. |
| **MEDIUM** | White background conflicts with dark header | `globals.css` sets `--background-start-rgb: 255, 255, 255` (white). Header is `bg-gray-950` (near-black). Creates a jarring split-screen effect. |

### 2. Leaderboard (`/leaderboard`)

**Source:** `src/app/leaderboard/page.tsx`, `src/components/LeaderboardCards.tsx`

| Severity | Issue | Detail |
|----------|-------|--------|
| **MEDIUM** | Wasted API call | `useEffect` fetches `/api/leaderboard` but discards the response — always uses `fixtures.scoreResults`. The loading spinner delay is artificial. |
| **MEDIUM** | ROI bar caps at 100% but actual value is 120% | Top contestant has `roi: 1.2`. `MetricBar` with `max=1` produces `pct = min(100, 120) = 100`. The bar shows full but the underlying value is misleadingly truncated. Consider `max={Math.max(1, ...allRoiValues)}` or remove the cap. |
| **LOW** | No loading spinner/skeleton | Loading state shows plain text "Loading leaderboard…". |
| **LOW** | Score number lacks label | The total score (e.g., `88`) appears bottom-right with no label or unit. Users don't know if it's a percentage, score out of 100, or something else. |

### 3. Challenges (`/challenges`)

**Source:** `src/app/challenges/page.tsx`

| Severity | Issue | Detail |
|----------|-------|--------|
| **CRITICAL** | Not reachable from navigation | `/challenges` is not in `NAV_LINKS` in `layout.tsx`. Users can only reach it by manually typing the URL. |
| **MEDIUM** | Light theme breaks consistency | Uses `bg-gray-50` (light) while leaderboard/receipts/trace use `bg-gray-950` (dark). Header is always dark. Navigating from leaderboard to challenges causes a theme flash. |
| **LOW** | `fmtTime` only shows minutes | Time limits like `7200s` display as `120m` instead of `2h`. |

### 4. Challenge Detail (`/challenges/fund-yourself`)

**Source:** `src/app/challenges/[id]/page.tsx`

| Severity | Issue | Detail |
|----------|-------|--------|
| **MEDIUM** | Light theme breaks consistency | Same `bg-gray-50` as challenges listing — inconsistent with dark-themed pages. |
| **LOW** | No link to view runs for this challenge | After reading the challenge spec, there's no "View Runs" or "Start Run" CTA. |

### 5. Run Detail (`/runs/run_001`)

**Source:** `src/app/runs/[id]/page.tsx`

| Severity | Issue | Detail |
|----------|-------|--------|
| **CRITICAL** | Not reachable from any navigation | There's no `/runs` index page (navigating to `/runs` → 404). Leaderboard cards don't link to runs. The nav doesn't include runs. The only way to reach this page is by guessing the URL. |
| **HIGH** | Light theme inconsistent with rest of app | Run detail uses white cards (`bg-white`) on a light page. Header is dark. Other data-heavy pages (leaderboard, receipts, trace) use dark theme. |
| **MEDIUM** | React effect dependency bug | Line 264: `[mode === "replay"]` evaluates to `[true]` or `[false]`. If `run.id` changes while mode stays "replay", the auto-start effect won't fire. Should be `[mode]` or include `run?.id`. |
| **MEDIUM** | Stale fixture timestamps | `relativeTime()` computes `Date.now() - fixtureTs`. Since fixtures use `2026-06-21T16:00:00Z`, timestamps show "Xh ago" that grow increasingly stale. |

### 6. Run Receipts (`/runs/run_001/receipts`)

**Source:** `src/app/runs/[id]/receipts/page.tsx`

| Severity | Issue | Detail |
|----------|-------|--------|
| **HIGH** | Same reachability issue as run detail | Only reachable via direct URL or from run detail page. |
| **LOW** | Inconsistent chart height | Burn chart uses `h-72` (288px) here vs `h-40` (160px) on run detail page for the same chart. |

### 7. Receipts (`/receipts`)

**Source:** `src/app/receipts/page.tsx`, `src/components/ReceiptsGallery.tsx`

| Severity | Issue | Detail |
|----------|-------|--------|
| **HIGH** | Receipt sign convention is inverted | `ReceiptsGallery.tsx` line 112: `{r.kind === "charge" ? "+" : "-"}`. Charges (money spent) show as `+`; payouts (money received) show as `-`. This is backwards and contradicts the run detail page where charges produce negative deltas. Colors are correct (red for charge, green for payout) which makes the sign error more confusing. |
| **LOW** | Raw ISO timestamps | Line 103: `{r.ts}` displays full ISO strings like `2026-06-21T16:02:30.000Z`. Should use `toLocaleString()` or similar. |

### 8. Trace (`/trace`)

**Source:** `src/app/trace/page.tsx`, `src/components/TracePanel.tsx`

| Severity | Issue | Detail |
|----------|-------|--------|
| **LOW** | Stale relative timestamps | `relativeTime()` shows "Xh ago" for fixture data from a fixed date. |
| **LOW** | No empty state message | If no events match the run filter, the panel shows nothing — no "No events for this run" message. |

### 9. Demo (`/demo`)

**Source:** `src/app/demo/page.tsx`, `src/app/demo/layout.tsx`

| Severity | Issue | Detail |
|----------|-------|--------|
| **MEDIUM** | Redundant header-hiding logic | `demo/layout.tsx` uses `document.querySelector("header").style.display = "none"` — but CSS `.restage-demo header { display: none }` already handles this. The JS approach is fragile (depends on DOM structure) and redundant. |
| **LOW** | All trace events from all runs shown | `TracePanel` receives `fixtures.traceEvents` (all 30 events across 3 runs). For a demo, this could be overwhelming. |

---

## Cross-Cutting Issues

| Severity | Issue | Detail |
|----------|-------|--------|
| **HIGH** | Theme inconsistency across pages | Dark pages: leaderboard, receipts, trace, demo. Light pages: home, challenges, challenge-detail, run-detail. The header is always dark. This creates jarring transitions. Pick one theme. |
| **MEDIUM** | No active nav link state | Nav links all look the same regardless of current route. No visual indication of which page is active. |
| **MEDIUM** | No `/runs` index page | Only `/runs/[id]` exists. `/runs` → 404. |
| **MEDIUM** | No custom 404 page | Default Next.js 404 for unknown routes. |
| **LOW** | No responsive/mobile nav | 5+ nav links wrap/squish on mobile. No hamburger menu. |
| **LOW** | No favicon | Browser shows default icon. |
| **LOW** | No React error boundaries | Render errors crash the page with no graceful fallback. |

---

## Prioritized Fix List

### 🔴 CRITICAL (Fix First)

1. **Add `/challenges` to navigation**
   - File: `src/app/layout.tsx`
   - Add `{ href: "/challenges", label: "Challenges" }` to `NAV_LINKS`

2. **Create `/runs` index page or add run links**
   - Create `src/app/runs/page.tsx` listing all runs with links to detail pages
   - OR add `{ href: "/runs", label: "Runs" }` to nav (if the index page is created)
   - Make leaderboard cards link to their respective runs: wrap each card in `<Link href={`/runs/${row.run_id}`}>`

### 🟠 HIGH (Fix Next)

3. **Unify the color theme**
   - Decision: go all-dark or all-light
   - Recommendation: all-dark (matches the data-heavy dashboard pages)
   - Update `page.tsx`, `challenges/page.tsx`, `challenges/[id]/page.tsx`, `runs/[id]/page.tsx` to use `bg-gray-950 text-gray-100`
   - Update `globals.css` `--background-start-rgb` and `--background-end-rgb` to dark values

4. **Redesign home page**
   - Add hero section with CTA buttons to Challenges and Leaderboard
   - Add quick stats (X challenges, Y contestants, Z runs)
   - Add feature cards explaining the platform
   - Use dark theme to match rest of app

5. **Fix receipt sign convention in ReceiptsGallery**
   - File: `src/components/ReceiptsGallery.tsx` line 112
   - Change: `{r.kind === "charge" ? "+" : "-"}` → `{r.kind === "charge" ? "−" : "+"}`
   - Swap to match the convention used in `runs/[id]/page.tsx`

6. **Add active nav link styling**
   - File: `src/app/layout.tsx`
   - Use `usePathname()` to detect current route and apply active styling (e.g., `text-white font-medium` vs `text-gray-300`)

### 🟡 MEDIUM (Fix Soon)

7. **Fix React effect dependency in run detail**
   - File: `src/app/runs/[id]/page.tsx` line 264
   - Change: `}, [mode === "replay"])` → `}, [mode])`

8. **Remove or use the API call in leaderboard**
   - File: `src/app/leaderboard/page.tsx`
   - Either use the fetched data or remove the `useEffect` fetch and show fixtures immediately (no loading state needed)

9. **Remove redundant header-hiding JS in demo layout**
   - File: `src/app/demo/layout.tsx`
   - Remove the `useEffect` that does `document.querySelector("header")` — CSS already handles it

10. **Handle ROI values > 1.0 in MetricBar**
    - File: `src/components/LeaderboardCards.tsx`
    - Pass `max={Math.max(1, ...data.map(d => d.dimensions.roi))}` or display actual value instead of capped percentage

11. **Add label to leaderboard score number**
    - File: `src/components/LeaderboardCards.tsx`
    - Add "Score" label above the number, or show as `{(row.total * 100).toFixed(0)}/100`

12. **Format receipt timestamps**
    - File: `src/components/ReceiptsGallery.tsx` line 103
    - Change `{r.ts}` → `{new Date(r.ts).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}`

13. **Create custom 404 page**
    - Create `src/app/not-found.tsx` with branded styling

14. **Improve `fmtTime` to show hours**
    - In challenges pages: `7200s` → `2h` or `1h 30m`

### 🟢 LOW (Backlog)

15. Add loading spinner component for async states
16. Add favicon (`src/app/favicon.ico`)
17. Add mobile hamburger menu for nav
18. Add React error boundaries
19. Add empty-state messages for filtered trace events
20. Standardize burn chart height between run detail and receipts pages

---

## Files Modified/Created

| File | Action |
|------|--------|
| `scripts/qa-audit.js` | **Created** — Playwright QA audit script for automated screenshots + console error capture |
| `qa-screenshots/.gitkeep` | **Created** — Directory placeholder |
| `qa-screenshots/QA-AUDIT-REPORT.md` | **Created** — This report |
