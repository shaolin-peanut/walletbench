/**
 * Stripe test-mode client stub — S2 scaffold.
 * E3 will implement charge/payout/refund helpers.
 */
import Stripe from "stripe";

const secretKey = process.env.STRIPE_TEST_SECRET_KEY;

if (!secretKey) {
  console.warn("[stripe] STRIPE_TEST_SECRET_KEY not set. Stripe operations will fail.");
}

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion })
  : null;

export function isStripeReady(): boolean {
  return !!stripe;
}
