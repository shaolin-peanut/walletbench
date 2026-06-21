import {
  Contestant,
  Run,
  Receipt,
  TraceEvent,
  Challenge,
  ScoreResult,
} from "./types";

// Mock fixtures for S3 — replace with generated data from build brief §10

export const mockContestants: Contestant[] = [
  { id: "c-001", name: "Alpha", kind: "hermes_profile" },
  { id: "c-002", name: "Beta", kind: "external", endpoint: "https://beta.example.com" },
  { id: "c-003", name: "Gamma", kind: "hermes_profile" },
];

export const mockRuns: Run[] = [
  {
    id: "r-001",
    challenge_id: "fund-yourself",
    contestant_id: "c-001",
    status: "running",
    started_at: new Date().toISOString(),
    ended_at: null,
    wallet: { start_cents: 2500, balance_cents: 2500, currency: "usd" },
    live: true,
  },
];

export const mockReceipts: Receipt[] = [
  {
    run_id: "r-001",
    ts: new Date().toISOString(),
    kind: "charge",
    amount_cents: 2500,
    currency: "usd",
    purpose: "Initial budget",
    stripe_ref: "cs_test_123",
    balance_after_cents: 2500,
  },
];

export const mockTraceEvents: TraceEvent[] = [
  {
    run_id: "r-001",
    seq: 1,
    ts: new Date().toISOString(),
    type: "decision",
    summary: "Challenge started",
    data: {},
  },
];

// Aggregated fixtures object for API routes
export const fixtures = {
  challenges: [
    {
      id: "fund-yourself",
      title: "Fund Yourself",
      goal: "Net-positive on a $25 test budget. Build something that generates real revenue in Stripe test mode.",
      budget_cents: 2500,
      currency: "usd",
      allowed_tools: ["stripe"],
      policy: { spend_cap_cents: 2500, approval_threshold_cents: 1000, forbidden_tools: [] },
      time_limit_seconds: 3600,
      success_check: { type: "revenue_positive", params: { min_revenue_cents: 1 } },
      scoring_weights: { task_success: 0.4, roi: 0.2, cost: 0.2, quality: 0.1, time: 0.05, policy: 0.05 },
    } as Challenge,
  ],
  runs: mockRuns,
  receipts: mockReceipts,
  leaderboard: [
    {
      run_id: "r-001",
      contestant_id: "c-001",
      contestant_name: "Alpha",
      final_balance_cents: 3200,
      score: 87,
      rank: 1,
    },
    {
      run_id: "r-002",
      contestant_id: "c-002",
      contestant_name: "Beta",
      final_balance_cents: 2100,
      score: 62,
      rank: 2,
    },
    {
      run_id: "r-003",
      contestant_id: "c-003",
      contestant_name: "Gamma",
      final_balance_cents: 1800,
      score: 45,
      rank: 3,
    },
  ],
  traceEvents: mockTraceEvents,
};
