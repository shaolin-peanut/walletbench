import { z } from "zod";
import {
  ChallengeSchema,
  ContestantSchema,
  RunSchema,
  TraceEventSchema,
  ReceiptSchema,
  ScoreResultSchema,
  PolicyDecisionSchema,
} from "../src/lib/types";

const examples = {
  ChallengeSchema: {
    id: "ch-001",
    title: "Fund Yourself",
    goal: "Net-positive on a $25 test budget",
    budget_cents: 2500,
    currency: "usd",
    allowed_tools: ["stripe"],
    policy: {
      spend_cap_cents: 2500,
      approval_threshold_cents: 1000,
      forbidden_tools: ["transfer"],
    },
    time_limit_seconds: 3600,
    success_check: { type: "revenue_positive", params: { min_revenue_cents: 1 } },
    scoring_weights: {
      task_success: 0.4,
      roi: 0.2,
      cost: 0.2,
      quality: 0.1,
      time: 0.05,
      policy: 0.05,
    },
  },
  ContestantSchema: {
    id: "c-001",
    name: "Alpha",
    kind: "hermes_profile",
    endpoint: "https://alpha.example.com",
  },
  RunSchema: {
    id: "r-001",
    challenge_id: "ch-001",
    contestant_id: "c-001",
    status: "running",
    started_at: "2026-06-21T16:00:00.000Z",
    ended_at: null,
    wallet: { start_cents: 2500, balance_cents: 2000, currency: "usd" },
    live: true,
  },
  TraceEventSchema: {
    run_id: "r-001",
    seq: 1,
    ts: "2026-06-21T16:00:01.000Z",
    type: "tool_call",
    summary: "Called Stripe API",
    data: { tool: "stripe", args: { action: "charge" }, result: { id: "ch_123" } },
  },
  ReceiptSchema: {
    run_id: "r-001",
    ts: "2026-06-21T16:00:01.000Z",
    kind: "charge",
    amount_cents: 500,
    currency: "usd",
    purpose: "Test charge",
    stripe_ref: "cs_test_123",
    balance_after_cents: 2000,
  },
  ScoreResultSchema: {
    run_id: "r-001",
    challenge_id: "ch-001",
    contestant_id: "c-001",
    dimensions: {
      task_success: 0.8,
      money_left_cents: 2000,
      roi: 0.2,
      quality: 0.7,
      time_seconds: 1200,
      policy_violations: 0,
      auditability: 0.9,
    },
    total: 0.72,
    rank: 1,
  },
  PolicyDecisionSchema: {
    allowed: true,
    reason: "Within spend cap",
    requires_approval: false,
  },
};

let passed = 0;
let failed = 0;

for (const [name, schema] of [
  ["ChallengeSchema", ChallengeSchema],
  ["ContestantSchema", ContestantSchema],
  ["RunSchema", RunSchema],
  ["TraceEventSchema", TraceEventSchema],
  ["ReceiptSchema", ReceiptSchema],
  ["ScoreResultSchema", ScoreResultSchema],
  ["PolicyDecisionSchema", PolicyDecisionSchema],
] as [string, unknown][]) {
  try {
    (schema as z.ZodAny).parse(examples[name as keyof typeof examples]);
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`, err);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
