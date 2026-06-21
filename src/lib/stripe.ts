import Stripe from "stripe";

const secretKey = process.env.STRIPE_TEST_SECRET_KEY;

if (!secretKey) {
  console.warn("STRIPE_TEST_SECRET_KEY not set; Stripe client unavailable");
}

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: "2024-04-10" as Stripe.LatestApiVersion })
  : null;

export function isStripeEnabled(): boolean {
  return !!stripe;
}
