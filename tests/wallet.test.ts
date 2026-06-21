import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Wallet, PolicyViolationError } from "../src/lib/wallet";
import type { Policy } from "../src/lib/types";

const policy = (overrides: Partial<Policy> = {}): Policy => ({
  spend_cap_cents: 10000,
  approval_threshold_cents: 500,
  forbidden_tools: ["stripe"],
  ...overrides,
});

const rejectingStripe = {
  charges: {
    create: (_params: any) => {
      throw new Error("Stripe charge should not be called in this test");
    },
  },
  payouts: {
    create: (_params: any) => {
      throw new Error("Stripe payout should not be called in this test");
    },
  },
};

describe("Wallet", () => {
  it("charge with a forbidden tool is rejected before Stripe is called", () => {
    const wallet = new Wallet("run_test", 2500, "usd", policy(), rejectingStripe);
    assert.throws(
      () => wallet.charge(100, "stripe", "forbidden"),
      (err: Error) => {
        if (err instanceof PolicyViolationError) {
          assert.strictEqual(err.reason, "tool is forbidden");
          return true;
        }
        return false;
      },
    );
  });

  it("above-threshold action requires approval and does not proceed automatically", () => {
    const wallet = new Wallet("run_test", 2500, "usd", policy(), rejectingStripe);
    const result = wallet.charge(600, "search", "above threshold");
    assert.strictEqual(result.status, "pending_approval");
    assert.ok(result.actionId);
    assert.strictEqual(wallet.getBalanceCents(), 2500);
  });

  it("payout with a forbidden tool is rejected before Stripe is called", () => {
    const wallet = new Wallet("run_test", 2500, "usd", policy(), rejectingStripe);
    assert.throws(
      () => wallet.payout(100, "stripe", "forbidden payout"),
      (err: Error) => {
        if (err instanceof PolicyViolationError) {
          assert.strictEqual(err.reason, "tool is forbidden");
          return true;
        }
        return false;
      },
    );
  });

  it("approved pending charge executes and updates balance", () => {
    const calls: any[] = [];
    const stripe = {
      charges: {
        create: (params: any) => {
          calls.push(params);
          return { id: "pi_test_123" };
        },
      },
      payouts: {
        create: (_params: any) => {
          throw new Error("Unexpected payout call");
        },
      },
    };
    const wallet = new Wallet("run_test", 2500, "usd", policy(), stripe as any);
    const pending = wallet.charge(600, "search", "above threshold");
    if (pending.status === "pending_approval") {
      const receipt = wallet.approveAction(pending.actionId);
      assert.strictEqual(receipt.kind, "charge");
      assert.strictEqual(receipt.amount_cents, 600);
      assert.strictEqual(wallet.getBalanceCents(), 1900);
    } else {
      assert.fail("expected pending approval");
    }
  });

  it("reject pending action removes it and prevents later approval", () => {
    const wallet = new Wallet("run_test", 2500, "usd", policy(), rejectingStripe);
    const pending = wallet.charge(600, "search", "reject me");
    assert.strictEqual(pending.status, "pending_approval");
    assert.strictEqual(wallet.rejectAction(pending.actionId), true);
    assert.throws(() => wallet.approveAction(pending.actionId));
  });

  it("under-threshold charge proceeds immediately without approval", () => {
    const calls: any[] = [];
    const stripe = {
      charges: {
        create: (params: any) => {
          calls.push(params);
          return { id: "pi_test_123" };
        },
      },
      payouts: {
        create: (_params: any) => {
          throw new Error("Unexpected payout call");
        },
      },
    };
    const wallet = new Wallet("run_test", 2500, "usd", policy(), stripe as any);
    const receipt = wallet.charge(400, "search", "under threshold");
    assert.strictEqual(receipt.kind, "charge");
    assert.strictEqual(receipt.amount_cents, 400);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(wallet.getBalanceCents(), 2100);
  });
});
