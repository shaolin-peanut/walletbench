import { requireStripe } from "../src/lib/stripe-helpers";

if (!process.env.STRIPE_TEST_SECRET_KEY) {
  console.error("Missing STRIPE_TEST_SECRET_KEY");
  process.exit(1);
}

const s = requireStripe();

(async () => {
  try {
    const payout = await s.payouts.create({
      amount: 50,
      currency: "usd",
      method: "standard",
    });
    console.log(JSON.stringify(payout, null, 2));
  } catch (err: any) {
    console.error("PAYOUT_ERROR", err?.raw?.message || err?.message || String(err));
    process.exit(1);
  }
})();
