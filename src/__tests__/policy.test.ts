import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import {
  evaluatePolicy,
  requestApproval,
  approveAction,
  rejectAction,
  hasPendingApproval,
  logViolation,
} from "../lib/policy";
import { getDb, resetDb } from "../lib/db";
import { TraceEventSchema } from "../lib/types";

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

  it("requestApproval returns a pending approval decision", () => {
    const action = { kind: "spend", amount_cents: 1500, tool: "stripe_checkout" };
    const decision = requestApproval(action);

    assert.strictEqual(decision.allowed, true);
    assert.strictEqual(decision.requires_approval, true);
    assert.strictEqual(decision.reason, "awaiting approval");
    assert.match(decision.pending_id, /^approval_[a-f0-9]{16}$/);
    assert.strictEqual(hasPendingApproval(decision.pending_id), true);
  });

  it("approveAction marks a pending action approved", () => {
    const action = { kind: "spend", amount_cents: 1500, tool: "stripe_checkout" };
    const approval = requestApproval(action);

    const approved = approveAction(approval.pending_id);
    assert.ok(approved);
    assert.strictEqual(approved.allowed, true);
    assert.strictEqual(approved.reason, "approved");
    assert.strictEqual(approved.requires_approval, false);
    assert.strictEqual(hasPendingApproval(approval.pending_id), false);
  });

  it("logViolation appends a schema-valid seq-numbered policy_violation trace event", () => {
    resetDb();
    process.env.DB_PATH = ":memory:";
    const db = getDb();
    db.prepare(
      `INSERT INTO trace_events (run_id, seq, ts, type, summary, data) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run("run_policy", 1, new Date().toISOString(), "decision", "started policy review", JSON.stringify({ result: "ok" }));

    const event = logViolation("run_policy", {
      violation_kind: "approval_rejected",
      tool: "stripe_checkout",
      reason: "owner rejected approval",
      amount_cents: 1500,
    });

    assert.deepStrictEqual(event.data, {
      violation_kind: "approval_rejected",
      tool: "stripe_checkout",
      reason: "owner rejected approval",
      amount_cents: 1500,
    });
    assert.strictEqual(event.seq, 2);
    assert.strictEqual(event.type, "policy_violation");
    assert.strictEqual(event.summary, "Policy violation: approval_rejected for stripe_checkout — owner rejected approval");
    TraceEventSchema.parse(event);

    const stored = db.prepare("SELECT * FROM trace_events WHERE run_id = ? ORDER BY seq").all("run_policy") as any[];
    assert.strictEqual(stored.length, 2);
    assert.strictEqual(stored[1].seq, 2);
    assert.strictEqual(stored[1].type, "policy_violation");
  });

  it("rejectAction marks rejected and logs a seq-numbered policy violation", () => {
    resetDb();
    process.env.DB_PATH = ":memory:";
    const db = getDb();
    db.prepare(
      `INSERT INTO trace_events (run_id, seq, ts, type, summary, data) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run("run_reject", 1, new Date().toISOString(), "tool_call", "requested checkout approval", JSON.stringify({ tool: "stripe_checkout" }));

    const action = { kind: "spend", amount_cents: 1500, tool: "stripe_checkout" };
    const approval = requestApproval(action);

    const rejected = rejectAction(approval.pending_id, "run_reject");
    assert.ok(rejected);
    assert.strictEqual(rejected.allowed, false);
    assert.strictEqual(rejected.reason, "rejected");
    assert.strictEqual(rejected.requires_approval, false);
    assert.strictEqual(hasPendingApproval(approval.pending_id), false);

    const stored = db.prepare("SELECT * FROM trace_events WHERE run_id = ? ORDER BY seq").all("run_reject") as any[];
    assert.strictEqual(stored.length, 2);
    assert.strictEqual(stored[1].seq, 2);
    assert.strictEqual(stored[1].type, "policy_violation");
    assert.deepStrictEqual(JSON.parse(stored[1].data), {
      violation_kind: "approval_rejected",
      tool: "stripe_checkout",
      reason: "rejected",
      amount_cents: 1500,
    });
  });

  it("returns the same pending approval id for identical action input", () => {
    const action = { kind: "spend", amount_cents: 1500, tool: "stripe_checkout" };

    const firstApproval = requestApproval(action);
    const secondApproval = requestApproval({ tool: "stripe_checkout", amount_cents: 1500, kind: "spend" });

    assert.strictEqual(secondApproval.pending_id, firstApproval.pending_id);
    assert.strictEqual(hasPendingApproval(firstApproval.pending_id), true);

    const approved = approveAction(firstApproval.pending_id);
    assert.ok(approved);
    assert.strictEqual(approved.allowed, true);
    assert.strictEqual(hasPendingApproval(firstApproval.pending_id), false);
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
