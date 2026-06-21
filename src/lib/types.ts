// §10 TypeScript contracts
// S3 will populate this file with exact schemas from the build brief.

export interface Contestant {
  id: string;
  name: string;
  strategy: string;
}

export interface Run {
  id: string;
  contestantId: string;
  challengeId: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
}

export interface Receipt {
  id: string;
  runId: string;
  type: "charge" | "payout" | "refund";
  amountCents: number;
  purpose: string;
  stripeRef?: string;
  createdAt: string;
}

export interface TraceEvent {
  id: string;
  runId: string;
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface Policy {
  maxSpendCents: number;
  allowedCategories: string[];
  requireApprovalAboveCents: number;
}
