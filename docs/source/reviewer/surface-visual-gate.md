# Surface Visual Evidence Gate

**Owner:** wb-reviewer
**Status:** Active as of 2026-06-22
**Applies to:** Any Kanban task under `Builder-A (Surface)` that changes UI or claims a visual fix.

## Problem text-only tasks create

Builder-A tasks that touch `src/app/**`, `src/components/**`, or styling can be marked “done” without anyone actually looking at the rendered result. Text-only review catches schema mismatches but misses:

- Broken layouts that render whitespace where content should be
- Theme regressions (dark vs light seams, flash effects)
- Console/runtime errors that only appear in the browser
- Asset degradation (missing images, broken fonts, loader spinners)

## The 5-point gate

Before a Surface task is moved to **Ready for review**, the builder must supply **all** of the following in the task result/comments or a `SURFACE_GATE_MANIFEST.json` in the workspace root:

1. **2+ screenshots from the changed routes**
   - At least two distinct routes that the task touched.
   - Screenshots must be full-viewport (≥1280×720) and captured after `networkidle`.
2. **Exact route URLs**
   - The full URLs used for each screenshot (e.g., `http://localhost:3000/leaderboard`).
   - Include the port and protocol so the reviewer can reproduce.
3. **Build result**
   - Exact command used (`npm run build`) and its exit status (`pass` or `fail`).
   - If `fail`, attach the error output.
4. **Console / runtime errors**
   - A list of `console.error` and uncaught exception messages captured during the screenshot run.
   - None is valid; just state `[]`.
5. **Styling verification statement**
   - Explicit declaration: *“Genuine UI output”* or *“Degraded asset/runtime path”*.
   - If degraded, describe the fallback (e.g., CSS-only preview, missing font, etc.).

## How to collect the evidence

Use the repo’s existing Playwright tooling or this lightweight equivalent:

```bash
cd /home/ops/code/walletbench-surface
npx playwright install chromium
PORT=3000 BASE_URL=http://localhost:$PORT node scripts/qa-audit.js
```

Then copy the relevant routes and console errors into the manifest.

## How the reviewer enforces it

The reviewer will check the 5 points **before** opening the task as “Done.” If any item is missing or the screenshots don’t show the claimed fix, the reviewer will block the task and request a corrected evidence package.

A machine-checkable helper lives at:

```bash
node scripts/surface-gate-check.js /path/to/SURFACE_GATE_MANIFEST.json
```

## Manifest template

Builders should copy `SURFACE_GATE_MANIFEST.json` from the Surface repo root, fill it out, and attach it to the completion claim.

`/home/ops/code/walletbench-surface/SURFACE_GATE_MANIFEST.json`

Exit code `0` means all required fields are present and non-empty; non-zero means the reviewer should reject and ask for a corrected manifest.

## References

- `docs/source/reviewer/checklist.md` — updated to include this gate.
- `SURFACE_GATE_MANIFEST.json` — template builders copy and fill.
