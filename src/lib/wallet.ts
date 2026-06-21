// Wallet + Stripe-test spend execution with approval gate
import {
  evaluatePolicy,
  requestApproval,
  approveAction,
  rejectAction,
  hasPendingApproval,
  type Action,
} from "./policy";
import type { Policy, PolicyDecision, Receipt } from "./types";

export class PolicyViolationError extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = "PolicyViolationError";
  }
}

export interface PendingApproval {
  action: Action;
  amountCents: number;
  purpose: string;
  tool?: string;
}

export class Wallet {
  private runId: string;
  private balanceCents: number;
  private currency: string;
  private policy: Policy;
  private currentSpendCents: number;
  private pending: Map<string, PendingApproval>;
  private stripeClient: any | null;

  private seq = 0;

  constructor(
    runId: string,
    startCents: number,
    currency: string,
    policy: Policy,
    stripeClient: any | null,
  ) {
    this.runId = runId;
    this.balanceCents = startCents;
    this.currency = currency;
    this.policy = policy;
    this.currentSpendCents = 0;
    this.pending = new Map();
    this.stripeClient = stripeClient;
  }

  getBalanceCents(): number {
    return this.balanceCents;
  }

  getCurrentSpendCents(): number {
    return this.currentSpendCents;
  }

  charge(
    amountCents: number,
    tool: string | undefined,
    purpose: string,
  ): Receipt | { status: "pending_approval"; actionId: string } {
    const action: Action = { kind: "charge", amount_cents: amountCents, tool };
    const decision = evaluatePolicy(this.policy, this.currentSpendCents, action);
    if (!decision.allowed) {
      throw new PolicyViolationError(decision.reason);
    }
    if (decision.requires_approval) {
      const actionId = requestApproval(action);
      this.pending.set(actionId, { action, amountCents, purpose, tool });
      return { status: "pending_approval", actionId };
    }
    return this.executeCharge(amountCents, tool, purpose);
  }

  payout(
    amountCents: number,
    tool: string | undefined,
    purpose: string,
  ): Receipt | { status: "pending_approval"; actionId: string } {
    const action: Action = { kind: "payout", amount_cents: amountCents, tool };
    const decision = evaluatePolicy(this.policy, this.currentSpendCents, action);
    if (!decision.allowed) {
      throw new PolicyViolationError(decision.reason);
    }
    if (decision.requires_approval) {
      const actionId = requestApproval(action);
      this.pending.set(actionId, { action, amountCents, purpose, tool });
      return { status: "pending_approval", actionId };
    }
    return this.executePayout(amountCents, tool, purpose);
  }

  approveAction(actionId: string): Receipt {
    const entry = this.pending.get(actionId);
    if (!entry) {
      throw new Error(`No pending approval for ${actionId}`);
    }
    this.pending.delete(actionId);
    const policyResult = approveAction(actionId);
    if (!policyResult || !policyResult.allowed) {
      throw new Error("Action was not approved");
    }
    if (entry.action.kind === "payout") {
      return this.executePayout(entry.amountCents, entry.tool, entry.purpose);
    }
    return this.executeCharge(entry.amountCents, entry.tool, entry.purpose);
  }

  rejectAction(actionId: string): boolean {
    const existed = this.pending.delete(actionId);
    if (existed) {
      rejectAction(actionId);
    }
    return existed;
  }

  private executeCharge(amountCents: number, _tool: string | undefined, purpose: string): Receipt {
    if (!this.stripeClient) {
      throw new Error("Stripe client not configured");
    }
    // Actual Stripe call is delegated to the injected client.
    this.stripeClient.charges.create({ amount: amountCents, currency: this.currency, purpose });
    this.balanceCents -= amountCents;
    this.currentSpendCents += amountCents;
    this.seq += 1;
    return {
      run_id: this.runId,
      ts: new Date().toISOString(),
      kind: "charge",
      amount_cents: amountCents,
      currency: this.currency,
      purpose,
      stripe_ref: `pi_test_${this.runId}_${String(this.seq).padStart(4, "0")}`,
      balance_after_cents: this.balanceCents,
    };
  }

  private executePayout(amountCents: number, _tool: string | undefined, purpose: string): Receipt {
    if (!this.stripeClient) {
      throw new Error("Stripe client not configured");
    }
    // Actual Stripe call is delegated to the injected client.
    this.stripeClient.payouts.create({ amount: amountCents, currency: this.currency, purpose });
    this.balanceCents -= amountCents;
    this.currentSpendCents += amountCents;
    this.seq += 1;
    return {
      run_id: this.runId,
      ts: new Date().toISOString(),
      kind: "payout",
      amount_cents: amountCents,
      currency: this.currency,
      purpose,
      stripe_ref: `po_test_${this.runId}_${String(this.seq).padStart(4, "0")}`,
      balance_after_cents: this.balanceCents,
    };
  }
}
