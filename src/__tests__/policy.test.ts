import { describe, it, before } from "node:test";
import assert from "node:assert";
import {
  evaluatePolicy,
  requestApproval,
  approveAction,
  rejectAction,
  logViolation,
  PolicyError,
  _resetPendingApprovals,
} from "../lib/policy";
import { resetDb } from "../lib/db";

describe("approval and violation policy functions", () => {
  before(() => {
    resetDb();
    _resetPendingApprovals();
    process.env.DB_PATH = ":memory:";
  });

  it("approval threshold triggers requires_approval=true", () => {
    const policy = {
      spend_cap_cents: 2500,
      approval_threshold_cents: 1000,
      forbidden_tools: [] as string[],
    };

    const below = evaluatePolicy(0, 500, policy);
    assert.strictEqual(below.requires_approval, false);
    assert.strictEqual(below.allowed, true);

    const above = evaluatePolicy(0, 1500, policy);
    assert.strictEqual(above.requires_approval, true);
    assert.strictEqual(above.allowed, true);
  });

  it("violation logging produces valid TraceEvent with correct seq numbering", () => {
    const runId = "run_violation_seq_test";

    const first = logViolation(runId, {
      kind: "overspend",
      tool: "stripe_checkout",
      reason: "spend cap exceeded",
      amount_cents: 3000,
    });

    assert.strictEqual(first.type, "policy_violation");
    assert.strictEqual(first.run_id, runId);
    assert.strictEqual(first.seq, 1);
    assert.strictEqual(first.summary, "Policy violation: spend cap exceeded");
    assert.deepStrictEqual(first.data, {
      tool: "stripe_checkout",
      violation_kind: "overspend",
      reason: "spend cap exceeded",
      amount_cents: 3000,
    });

    const second = logViolation(runId, {
      kind: "forbidden_tool",
      tool: "deploy",
      reason: "deploy is forbidden",
      amount_cents: 0,
    });

    assert.strictEqual(second.type, "policy_violation");
    assert.strictEqual(second.seq, 2);
    assert.deepStrictEqual(second.data, {
      tool: "deploy",
      violation_kind: "forbidden_tool",
      reason: "deploy is forbidden",
      amount_cents: 0,
    });
  });

  it("rejecting an approved action logs a violation", async () => {
    const action = {
      tool: "stripe_checkout",
      amount_cents: 1500,
    };
    const approval = requestApproval(action);

    // Sanity check: approval request rejects execution.
    assert.strictEqual(approval.requires_approval, true);
    assert.ok(approval.pending_id);

    // Initially pending, then reject.
    rejectAction(approval.pending_id);

    const { getDb } = await import("../lib/db");
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM trace_events WHERE run_id = ?")
      .all("unknown_run") as Array<Record<string, unknown>>;

    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].type, "policy_violation");
    const data = JSON.parse(rows[0].data as string);
    assert.strictEqual(data.tool, "stripe_checkout");
    assert.strictEqual(data.amount_cents, 1500);
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
    const decision = evaluatePolicy(600, 500, policy);
    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.requires_approval, false);
  });

  it("blocks invalid amounts", () => {
    const policy = {
      spend_cap_cents: 2000,
      approval_threshold_cents: 1000,
      forbidden_tools: [] as string[],
    };
    assert.strictEqual(evaluatePolicy(0, -1, policy).allowed, false);
    assert.strictEqual(evaluatePolicy(0, 0, policy).allowed, false);
    assert.strictEqual(evaluatePolicy(0, NaN, policy).allowed, false);
  });
});
