import { createHash } from "node:crypto";
import { getDb } from "./db";
import type { Policy, PolicyDecision, TraceEvent } from "./types";

export interface Action {
  kind: string;
  amount_cents: number;
  tool?: string;
}

export class PolicyViolationError extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = "PolicyViolationError";
  }
}

const REJECT_SPEND_CAP: PolicyDecision = {
  allowed: false,
  reason: "exceeds spend cap",
  requires_approval: false,
};

const REJECT_TOOL_ALLOWLIST: PolicyDecision = {
  allowed: false,
  reason: "tool not in allowed list",
  requires_approval: false,
};

const REJECT_FORBIDDEN_TOOL: PolicyDecision = {
  allowed: false,
  reason: "tool is forbidden",
  requires_approval: false,
};

const REJECT_INVALID_AMOUNT: PolicyDecision = {
  allowed: false,
  reason: "invalid amount",
  requires_approval: false,
};

const PASS_WITHIN_CAP: PolicyDecision = {
  allowed: true,
  reason: "within cap",
  requires_approval: false,
};

export function evaluatePolicy(
  policy: Policy,
  currentSpendCents: number,
  action: Action,
): PolicyDecision {
  if (!Number.isFinite(action.amount_cents) || action.amount_cents <= 0) {
    return REJECT_INVALID_AMOUNT;
  }

  const projected = currentSpendCents + action.amount_cents;

  if (projected >= policy.spend_cap_cents) {
    return REJECT_SPEND_CAP;
  }

  if (
    policy.allowed_tools !== undefined &&
    action.tool !== undefined &&
    !policy.allowed_tools.includes(action.tool)
  ) {
    return REJECT_TOOL_ALLOWLIST;
  }

  if (action.tool !== undefined && policy.forbidden_tools.includes(action.tool)) {
    return REJECT_FORBIDDEN_TOOL;
  }

  if (action.amount_cents < policy.approval_threshold_cents) {
    return PASS_WITHIN_CAP;
  }

  return {
    allowed: true,
    reason: "above approval threshold",
    requires_approval: true,
  };
}

// Approval lifecycle (in-memory, per-process)
export interface ApprovalDecision extends PolicyDecision {
  pending_id: string;
}

export interface PolicyViolation {
  violation_kind: string;
  tool?: string;
  reason: string;
  amount_cents?: number;
}

const _pendingApprovals = new Map<string, { action: Action; decision: ApprovalDecision }>();

function stableActionKey(action: Action): string {
  return JSON.stringify({
    amount_cents: action.amount_cents,
    kind: action.kind,
    tool: action.tool ?? null,
  });
}

function deterministicApprovalId(action: Action): string {
  const digest = createHash("sha256").update(stableActionKey(action)).digest("hex").slice(0, 16);
  return `approval_${digest}`;
}

export function requestApproval(action: Action): ApprovalDecision {
  const id = deterministicApprovalId(action);
  const decision: ApprovalDecision = {
    allowed: true,
    reason: "awaiting approval",
    requires_approval: true,
    pending_id: id,
  };
  _pendingApprovals.set(id, { action, decision });
  return decision;
}

export function approveAction(actionId: string): PolicyDecision | null {
  const entry = _pendingApprovals.get(actionId);
  if (!entry) return null;
  _pendingApprovals.delete(actionId);
  return { allowed: true, reason: "approved", requires_approval: false };
}

export function rejectAction(actionId: string, runId?: string): PolicyDecision | null {
  const entry = _pendingApprovals.get(actionId);
  if (!entry) return null;
  _pendingApprovals.delete(actionId);

  const decision: PolicyDecision = { allowed: false, reason: "rejected", requires_approval: false };
  if (runId) {
    logViolation(runId, {
      violation_kind: "approval_rejected",
      tool: entry.action.tool,
      reason: decision.reason,
      amount_cents: entry.action.amount_cents,
    });
  }
  return decision;
}

export function logViolation(runId: string, violation: PolicyViolation): TraceEvent {
  const db = getDb();
  const row = db.prepare("SELECT MAX(seq) as maxSeq FROM trace_events WHERE run_id = ?").get(runId) as { maxSeq: number | null };
  const seq = (row.maxSeq ?? 0) + 1;
  const ts = new Date().toISOString();
  const data = {
    violation_kind: violation.violation_kind,
    ...(violation.tool !== undefined ? { tool: violation.tool } : {}),
    reason: violation.reason,
    ...(violation.amount_cents !== undefined ? { amount_cents: violation.amount_cents } : {}),
  };
  const summaryTool = violation.tool ? ` for ${violation.tool}` : "";
  const summary = `Policy violation: ${violation.violation_kind}${summaryTool} — ${violation.reason}`;

  db.prepare(`INSERT INTO trace_events (run_id, seq, ts, type, summary, data) VALUES (?, ?, ?, ?, ?, ?)`).run(
    runId,
    seq,
    ts,
    "policy_violation",
    summary,
    JSON.stringify(data),
  );

  return { run_id: runId, seq, ts, type: "policy_violation", summary, data };
}

export function hasPendingApproval(actionId: string): boolean {
  return _pendingApprovals.has(actionId);
}
