import { Policy, PolicyDecision, TraceEvent } from "./types";
import { getDb, resetDb } from "./db";

export class PolicyError extends Error {
  decision: PolicyDecision;
  constructor(decision: PolicyDecision) {
    super(decision.reason);
    this.decision = decision;
    this.name = "PolicyError";
  }
}

export function evaluatePolicy(
  totalSpentCents: number,
  amountCents: number,
  policy: Policy
): PolicyDecision {
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return {
      allowed: false,
      reason: "Amount must be a positive integer",
      requires_approval: false,
    };
  }
  if (totalSpentCents + amountCents > policy.spend_cap_cents) {
    return {
      allowed: false,
      reason: `Over cap: ${totalSpentCents + amountCents} exceeds ${policy.spend_cap_cents}`,
      requires_approval: false,
    };
  }
  return {
    allowed: true,
    reason:
      amountCents >= policy.approval_threshold_cents
        ? "Within cap, within approved tools"
        : "Within cap",
    requires_approval: amountCents >= policy.approval_threshold_cents,
  };
}

// --- Approval gates + violation logging ---

interface PendingApproval {
  id: string;
  action: unknown;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const pendingApprovals = new Map<string, PendingApproval>();

export function requestApproval(action: unknown): {
  requires_approval: true;
  reason: string;
  pending_id: string;
} {
  const pending_id = `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  pendingApprovals.set(pending_id, {
    id: pending_id,
    action,
    status: "pending",
    createdAt: new Date(),
  });
  return {
    requires_approval: true,
    reason: `Action requires approval: ${typeof action === "string" ? action : JSON.stringify(action)}`,
    pending_id,
  };
}

export function approveAction(pending_id: string): boolean {
  const approval = pendingApprovals.get(pending_id);
  if (!approval) {
    throw new Error(`Pending approval not found: ${pending_id}`);
  }
  if (approval.status !== "pending") {
    throw new Error(`Pending approval ${pending_id} is already ${approval.status}`);
  }
  approval.status = "approved";
  return true;
}

export function rejectAction(pending_id: string): void {
  const approval = pendingApprovals.get(pending_id);
  if (!approval) {
    throw new Error(`Pending approval not found: ${pending_id}`);
  }
  if (approval.status !== "pending") {
    throw new Error(`Pending approval ${pending_id} is already ${approval.status}`);
  }
  approval.status = "rejected";

  const kind = "rejected_approval";
  const tool =
    typeof approval.action === "object" &&
    approval.action !== null &&
    "tool" in approval.action
      ? String((approval.action as Record<string, unknown>).tool)
      : "unknown";
  const reason = `Action ${pending_id} was rejected during approval gate`;
  const amount_cents =
    typeof approval.action === "object" &&
    approval.action !== null &&
    "amount_cents" in approval.action
      ? Number((approval.action as Record<string, unknown>).amount_cents)
      : 0;

  logViolation("unknown_run", { kind, tool, reason, amount_cents });
}

export function logViolation(
  runId: string,
  violation: { kind: string; tool: string; reason: string; amount_cents: number }
): TraceEvent {
  const db = getDb();

  const row = db
    .prepare("SELECT MAX(seq) as max_seq FROM trace_events WHERE run_id = ?")
    .get(runId) as { max_seq: number | null };
  const seq = (row?.max_seq ?? 0) + 1;
  const ts = new Date().toISOString();

  const event: TraceEvent = {
    run_id: runId,
    seq,
    ts,
    type: "policy_violation",
    summary: `Policy violation: ${violation.reason}`,
    data: {
      tool: violation.tool,
      violation_kind: violation.kind,
      reason: violation.reason,
      amount_cents: violation.amount_cents,
    },
  };

  db.prepare(
    `INSERT INTO trace_events (run_id, seq, ts, type, summary, data)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(runId, seq, ts, event.type, event.summary, JSON.stringify(event.data));

  return event;
}

// Internal reset for tests only.
export function _resetPendingApprovals() {
  pendingApprovals.clear();
}
