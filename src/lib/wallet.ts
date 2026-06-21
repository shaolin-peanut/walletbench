import { Receipt, Policy, PolicyDecision } from "./types";
import { PolicyError, evaluatePolicy } from "./policy";
import { isStripeEnabled, stripe } from "./stripe";

export class Wallet {
  private readonly runId: string;
  private readonly currency: string;
  private readonly policy: Policy;
  private balance: number;
  private totalSpent: number;
  private readonly receipts: Receipt[];
  private seq = 0;

  constructor(runId: string, startCents: number, currency: string, policy: Policy) {
    this.runId = runId;
    this.currency = currency;
    this.policy = policy;
    this.balance = startCents;
    this.totalSpent = 0;
    this.receipts = [];
  }

  getBalance(): number {
    return this.balance;
  }

  private async chargeStripe(amountCents: number, purpose: string): Promise<string> {
    if (!stripe) {
      return `mock_pi_${this.runId}_${String(++this.seq).padStart(4, "0")}`;
    }

    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: this.currency,
      metadata: { runId: this.runId, purpose },
      automatic_payment_methods: { enabled: true },
    });

    // Confirm the payment intent in test mode
    await stripe.paymentIntents.confirm(pi.id);

    // Retrieve the created charge so refunds can target the correct object
    const charges = await stripe.charges.list({ payment_intent: pi.id, limit: 1 });
    const chargeId = charges.data[0]?.id;
    if (!chargeId) {
      throw new Error(`No charge found for PaymentIntent ${pi.id}`);
    }

    return chargeId;
  }

  private async payoutStripe(amountCents: number, purpose: string): Promise<string> {
    // Payouts are not available in Stripe test mode; simulate with a mock reference.
    return `mock_po_${this.runId}_${String(++this.seq).padStart(4, "0")}`;
  }

  private async refundStripe(chargeId: string): Promise<string> {
    if (!stripe) {
      return `mock_re_${this.runId}_${String(++this.seq).padStart(4, "0")}`;
    }

    const refund = await stripe.refunds.create({
      charge: chargeId,
      metadata: { runId: this.runId },
    });

    return refund.id;
  }

  private recordReceipt(kind: Receipt["kind"], amountCents: number, purpose: string, stripeRef: string): Receipt {
    const receipt: Receipt = {
      run_id: this.runId,
      ts: new Date().toISOString(),
      kind,
      amount_cents: amountCents,
      currency: this.currency,
      purpose,
      stripe_ref: stripeRef,
      balance_after_cents: this.balance,
    };

    this.receipts.push(receipt);
    return receipt;
  }

  async charge(amountCents: number, purpose: string): Promise<Receipt> {
    const decision = evaluatePolicy(this.totalSpent, amountCents, this.policy);
    if (!decision.allowed) {
      throw new PolicyError(decision);
    }

    const stripeRef = await this.chargeStripe(amountCents, purpose);

    this.balance -= amountCents;
    this.totalSpent += amountCents;

    return this.recordReceipt("charge", amountCents, purpose, stripeRef);
  }

  async payout(amountCents: number, purpose: string): Promise<Receipt> {
    const decision = evaluatePolicy(this.totalSpent, amountCents, this.policy);
    if (!decision.allowed) {
      throw new PolicyError(decision);
    }

    const stripeRef = await this.payoutStripe(amountCents, purpose);

    this.balance += amountCents;

    return this.recordReceipt("payout", amountCents, purpose, stripeRef);
  }

  async refund(receiptId: string, reason: string): Promise<Receipt> {
    const original = this.receipts.find((r) => r.stripe_ref === receiptId);
    if (!original) {
      throw new Error(`Receipt not found: ${receiptId}`);
    }

    if (original.kind !== "charge") {
      throw new Error("Only charges may be refunded via Wallet.refund()");
    }

    const stripeRef = await this.refundStripe(original.stripe_ref);

    this.balance += original.amount_cents;
    this.totalSpent -= original.amount_cents;

    return this.recordReceipt("refund", original.amount_cents, reason, stripeRef);
  }
}

export function isMockMode(): boolean {
  return !isStripeEnabled();
}
