import type { Policy, PolicyDecision } from "./types";

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
const _pendingApprovals = new Map<string, { action: Action; decision: PolicyDecision }>();
let _nextApprovalId = 1;

export function requestApproval(action: Action): string {
  const id = `approval_${_nextApprovalId++}`;
  _pendingApprovals.set(id, {
    action,
    decision: { allowed: true, reason: "awaiting approval", requires_approval: true },
  });
  return id;
}

export function approveAction(actionId: string): PolicyDecision | null {
  const entry = _pendingApprovals.get(actionId);
  if (!entry) return null;
  _pendingApprovals.delete(actionId);
  return { allowed: true, reason: "approved", requires_approval: false };
}

export function rejectAction(actionId: string): PolicyDecision | null {
  const entry = _pendingApprovals.get(actionId);
  if (!entry) return null;
  _pendingApprovals.delete(actionId);
  return { allowed: false, reason: "rejected", requires_approval: false };
}

export function hasPendingApproval(actionId: string): boolean {
  return _pendingApprovals.has(actionId);
}
