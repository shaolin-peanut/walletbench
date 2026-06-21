import Stripe from "stripe";
import { stripe, isStripeEnabled } from "./stripe";

export function requireStripe(): Stripe {
  if (!isStripeEnabled()) {
    throw new Error("Stripe not configured: set STRIPE_TEST_SECRET_KEY");
  }
  return stripe as Stripe;
}

export async function createCharge(
  amount: number,
  currency: string,
  description?: string,
  source?: string
): Promise<Stripe.Charge> {
  const s = requireStripe();
  return s.charges.create({
    amount,
    currency,
    description,
    source,
  });
}

export async function refundCharge(
  chargeId: string,
  amount?: number
): Promise<Stripe.Refund> {
  const s = requireStripe();
  const params: Stripe.RefundCreateParams = { charge: chargeId };
  if (typeof amount === "number") {
    params.amount = amount;
  }
  return s.refunds.create(params);
}

export async function createCustomer(
  email?: string,
  name?: string
): Promise<Stripe.Customer> {
  const s = requireStripe();
  return s.customers.create({ email, name });
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Stripe.Event {
  const s = requireStripe();
  return s.webhooks.constructEvent(payload, signature, secret);
}
