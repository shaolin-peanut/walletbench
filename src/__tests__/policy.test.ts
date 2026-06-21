import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import {
  evaluatePolicy,
  requestApproval,
  approveAction,
  rejectAction,
  hasPendingApproval,
} from "../lib/policy";
import { resetDb } from "../lib/db";

describe("approval and violation policy functions", () => {
  before(() => {
    resetDb();
    process.env.DB_PATH = ":memory:";
  });

  it("approval threshold triggers requires_approval=true", () => {
    const policy = {
      spend_cap_cents: 2500,
      approval_threshold_cents: 1000,
      forbidden_tools: [] as string[],
    };

    const below = evaluatePolicy(policy, 0, { kind: "spend", amount_cents: 500, tool: "code_exec" });
    assert.strictEqual(below.requires_approval, false);
    assert.strictEqual(below.allowed, true);

    const above = evaluatePolicy(policy, 0, { kind: "spend", amount_cents: 1500, tool: "code_exec" });
    assert.strictEqual(above.requires_approval, true);
    assert.strictEqual(above.allowed, true);
  });

  it("rejecting an approved action returns a rejected decision", () => {
    const action = { kind: "spend", amount_cents: 1500, tool: "stripe_checkout" };
    const approvalId = requestApproval(action);

    assert.ok(approvalId);
    assert.strictEqual(hasPendingApproval(approvalId), true);

    const rejected = rejectAction(approvalId);
    assert.ok(rejected);
    assert.strictEqual(rejected.allowed, false);
    assert.strictEqual(rejected.reason, "rejected");
    assert.strictEqual(rejected.requires_approval, false);
    assert.strictEqual(hasPendingApproval(approvalId), false);
  });
});

describe("existing evaluatePolicy behavior", () => {
  before(() => {
    process.env.DB_PATH = ":memory:";
  });

  it("rejects over-cap spend", () => {
    const policy = {
      spend_cap_cents: 1000,
      approval_threshold_cents: 500,
      forbidden_tools: [] as string[],
    };
    const decision = evaluatePolicy(policy, 600, { kind: "spend", amount_cents: 500, tool: "code_exec" });
    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.requires_approval, false);
  });

  it("blocks invalid amounts", () => {
    const policy = {
      spend_cap_cents: 2000,
      approval_threshold_cents: 1000,
      forbidden_tools: [] as string[],
    };
    assert.strictEqual(evaluatePolicy(policy, 0, { kind: "spend", amount_cents: -1, tool: "code_exec" }).allowed, false);
    assert.strictEqual(evaluatePolicy(policy, 0, { kind: "spend", amount_cents: 0, tool: "code_exec" }).allowed, false);
    assert.strictEqual(evaluatePolicy(policy, 0, { kind: "spend", amount_cents: NaN as any, tool: "code_exec" }).allowed, false);
  });
});
