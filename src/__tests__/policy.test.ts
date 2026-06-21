import { describe, it, expect, beforeEach } from "vitest";
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
  beforeEach(() => {
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
    expect(below.requires_approval).toBe(false);
    expect(below.allowed).toBe(true);

    const above = evaluatePolicy(0, 1500, policy);
    expect(above.requires_approval).toBe(true);
    expect(above.allowed).toBe(true);
  });

  it("violation logging produces valid TraceEvent with correct seq numbering", () => {
    const runId = "run_violation_seq_test";

    const first = logViolation(runId, {
      kind: "overspend",
      tool: "stripe_checkout",
      reason: "spend cap exceeded",
      amount_cents: 3000,
    });

    expect(first.type).toBe("policy_violation");
    expect(first.run_id).toBe(runId);
    expect(first.seq).toBe(1);
    expect(first.summary).toBe("Policy violation: spend cap exceeded");
    expect(first.data).toEqual({
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

    expect(second.type).toBe("policy_violation");
    expect(second.seq).toBe(2);
    expect(second.data).toEqual({
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
    expect(approval.requires_approval).toBe(true);
    expect(approval.pending_id).toBeTruthy();

    // Initially pending, then reject.
    rejectAction(approval.pending_id);

    const { getDb } = await import("../lib/db");
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM trace_events WHERE run_id = ?")
      .all("unknown_run") as Array<Record<string, unknown>>;

    expect(rows.length).toBe(1);
    expect(rows[0].type).toBe("policy_violation");
    expect(JSON.parse(rows[0].data as string).tool).toBe("stripe_checkout");
    expect(JSON.parse(rows[0].data as string).amount_cents).toBe(1500);
  });
});

describe("existing evaluatePolicy behavior", () => {
  beforeEach(() => {
    process.env.DB_PATH = ":memory:";
  });

  it("rejects over-cap spend", () => {
    const policy = {
      spend_cap_cents: 1000,
      approval_threshold_cents: 500,
      forbidden_tools: [] as string[],
    };
    const decision = evaluatePolicy(600, 500, policy);
    expect(decision.allowed).toBe(false);
    expect(decision.requires_approval).toBe(false);
  });

  it("blocks invalid amounts", () => {
    const policy = {
      spend_cap_cents: 2000,
      approval_threshold_cents: 1000,
      forbidden_tools: [] as string[],
    };
    expect(evaluatePolicy(0, -1, policy).allowed).toBe(false);
    expect(evaluatePolicy(0, 0, policy).allowed).toBe(false);
    expect(evaluatePolicy(0, NaN, policy).allowed).toBe(false);
  });
});
