// §10 TypeScript contracts (exact field names)
import { z } from "zod";

// 1. Challenge (§10.1)
export interface Policy {
  spend_cap_cents: number;
  approval_threshold_cents: number;
  allowed_tools?: string[];
  forbidden_tools: string[];
}

export interface SuccessCheck {
  type: string;
  params: Record<string, unknown>;
}

export interface ScoringWeights {
  task_success: number;
  roi: number;
  cost: number;
  quality: number;
  time: number;
  policy: number;
}

export interface Challenge {
  id: string;
  title: string;
  goal: string;
  budget_cents: number;
  currency: string;
  allowed_tools: string[];
  policy: Policy;
  time_limit_seconds: number;
  success_check: SuccessCheck;
  scoring_weights: ScoringWeights;
}

// 2. Contestant (§10.2)
export interface Contestant {
  id: string;
  name: string;
  kind: "hermes_profile" | "external";
  endpoint?: string;
}

// 3. Run (§10.3)
export interface Wallet {
  start_cents: number;
  balance_cents: number;
  currency: string;
}

export interface Run {
  id: string;
  challenge_id: string;
  contestant_id: string;
  status: "running" | "complete" | "failed";
  started_at: string;
  ended_at: string | null;
  wallet: Wallet;
  live: boolean;
}

// 4. TraceEvent (§10.4)
export interface TraceEvent {
  run_id: string;
  seq: number;
  ts: string;
  type: "decision" | "tool_call" | "spend" | "artifact" | "policy_violation";
  summary: string;
  data: {
    tool?: string;
    args?: Record<string, unknown>;
    result?: unknown;
  };
}

// 5. Receipt (§10.5)
export interface Receipt {
  run_id: string;
  ts: string;
  kind: "charge" | "payout" | "refund";
  amount_cents: number;
  currency: string;
  purpose: string;
  stripe_ref: string;
  balance_after_cents: number;
}

// 6. ScoreResult (§10.6)
export interface ScoreDimensions {
  task_success: number;
  money_left_cents: number;
  roi: number;
  quality: number;
  time_seconds: number;
  policy_violations: number;
  auditability: number;
}

export interface ScoreResult {
  run_id: string;
  challenge_id: string;
  contestant_id: string;
  dimensions: ScoreDimensions;
  total: number;
  rank: number;
}

// 7. PolicyDecision (§10.7)
export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  requires_approval: boolean;
}

// Zod schemas
export const PolicySchema = z.object({
  spend_cap_cents: z.number(),
  approval_threshold_cents: z.number(),
  allowed_tools: z.array(z.string()).optional(),
  forbidden_tools: z.array(z.string()),
});

export const SuccessCheckSchema = z.object({
  type: z.string(),
  params: z.record(z.unknown()),
});

export const ScoringWeightsSchema = z.object({
  task_success: z.number(),
  roi: z.number(),
  cost: z.number(),
  quality: z.number(),
  time: z.number(),
  policy: z.number(),
});

export const ChallengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  goal: z.string(),
  budget_cents: z.number(),
  currency: z.string(),
  allowed_tools: z.array(z.string()),
  policy: PolicySchema,
  time_limit_seconds: z.number(),
  success_check: SuccessCheckSchema,
  scoring_weights: ScoringWeightsSchema,
});

export const ContestantSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["hermes_profile", "external"]),
  endpoint: z.string().optional(),
});

export const WalletSchema = z.object({
  start_cents: z.number(),
  balance_cents: z.number(),
  currency: z.string(),
});

export const RunSchema = z.object({
  id: z.string(),
  challenge_id: z.string(),
  contestant_id: z.string(),
  status: z.enum(["running", "complete", "failed"]),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  wallet: WalletSchema,
  live: z.boolean(),
});

export const TraceEventSchema = z.object({
  run_id: z.string(),
  seq: z.number(),
  ts: z.string(),
  type: z.enum(["decision", "tool_call", "spend", "artifact", "policy_violation"]),
  summary: z.string(),
  data: z.object({
    tool: z.string().optional(),
    args: z.record(z.unknown()).optional(),
    result: z.unknown().optional(),
  }),
});

export const ReceiptSchema = z.object({
  run_id: z.string(),
  ts: z.string(),
  kind: z.enum(["charge", "payout", "refund"]),
  amount_cents: z.number(),
  currency: z.string(),
  purpose: z.string(),
  stripe_ref: z.string(),
  balance_after_cents: z.number(),
});

export const ScoreDimensionsSchema = z.object({
  task_success: z.number(),
  money_left_cents: z.number(),
  roi: z.number(),
  quality: z.number(),
  time_seconds: z.number(),
  policy_violations: z.number(),
  auditability: z.number(),
});

export const ScoreResultSchema = z.object({
  run_id: z.string(),
  challenge_id: z.string(),
  contestant_id: z.string(),
  dimensions: ScoreDimensionsSchema,
  total: z.number(),
  rank: z.number(),
});

export const PolicyDecisionSchema = z.object({
  allowed: z.boolean(),
  reason: z.string(),
  requires_approval: z.boolean(),
});
