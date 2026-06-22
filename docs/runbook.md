# WalletBench runbook

## Prereqs

- Node.js 18+
- npm
- Stripe test keys (`sk_test_...`, `pk_test_...`)

## Setup

```bash
cp .env.local.example .env.local   # if present; otherwise create
```

`.env.local` needs:

```env
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Run

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Health check

```bash
curl http://localhost:3000/api/health
# expect: {"status":"ok"}
```

## Scoring CLI

Uses local fixtures only — no network.

```bash
# single trace
npx tsx scripts/wb-score.ts demo/fixtures/alpha-seed.json

# compare three
npx tsx scripts/wb-score.ts compare \
  demo/fixtures/alpha-seed.json \
  demo/fixtures/beta-seed.json \
  demo/fixtures/gamma-seed.json
```

## Tests

```bash
npm test
```

## Safety rules

- Every Stripe call is hard-coded to test mode.
- Spend caps are enforced in `src/lib/policy.ts` *before* any charge is attempted.
- Do not point `.env.local` at production keys.
