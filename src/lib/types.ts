/**
 * §10 TypeScript contracts — stub for S3 to populate.
 * Every schema from the build brief goes here.
 */

export interface Contestant {
  id: string;
  name: string;
  avatarUrl?: string;
  strategyDescription?: string;
}

export interface Wallet {
  contestantId: string;
  startCents: number;
  balanceCents: number;
}

export interface Policy {
  contestantId: string;
  spendCapCents: number;
  allowlist: string[]; // merchant IDs
  requireApprovalAboveCents: number;
}

export interface Goal {
  contestantId: string;
  type: "earn" | "spend" | "save";
  targetCents: number;
  description: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  initialBalanceCents: number;
  goals: Goal[];
  policies: Policy[];
}

export interface TraceEvent {
  id: string;
  runId: string;
  timestamp: string; // ISO 8601
  type: "action" | "receipt" | "policy_violation" | "milestone";
  payload: Record<string, unknown>;
}

export interface Receipt {
  id: string;
  runId: string;
  contestantId: string;
  type: "charge" | "payout" | "refund";
  amountCents: number;
  merchantId?: string;
  description?: string;
  stripeRef?: string;
  createdAt: string;
}

export interface Run {
  id: string;
  challengeId: string;
  contestantId: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  endedAt?: string;
  finalBalanceCents?: number;
  score?: number;
}

export interface LeaderboardEntry {
  runId: string;
  contestantId: string;
  contestantName: string;
  finalBalanceCents: number;
  score: number;
  rank: number;
}

export interface ScoringDimension {
  name: string;
  weight: number;
  value: number;
}

export interface ScoreBreakdown {
  runId: string;
  total: number;
  dimensions: ScoringDimension[];
}
