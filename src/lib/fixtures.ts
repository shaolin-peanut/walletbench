import {
  ChallengeSchema,
  ContestantSchema,
  RunSchema,
  TraceEventSchema,
  ReceiptSchema,
  ScoreResultSchema,
  PolicyDecisionSchema,
  type Challenge,
  type Contestant,
  type Run,
  type TraceEvent,
  type Receipt,
  type ScoreResult,
  type PolicyDecision,
} from "./types";

// --- 6 Challenges (AI Ops pack, §4.4) ---
// fund-yourself matches §10.1 EXACTLY

export const challenges: Challenge[] = [
  {
    id: "fund-yourself",
    title: "Fund Yourself",
    goal: "End net-positive on a $25 test budget within 30 minutes.",
    budget_cents: 2500,
    currency: "usd",
    allowed_tools: ["web_search", "stripe_checkout", "deploy", "code_exec"],
    policy: { spend_cap_cents: 2500, approval_threshold_cents: 1000, forbidden_tools: [] },
    time_limit_seconds: 1800,
    success_check: { type: "net_positive", params: {} },
    scoring_weights: { task_success: 0.3, roi: 0.3, cost: 0.1, quality: 0.1, time: 0.1, policy: 0.1 },
  } as Challenge,
  {
    id: "provision-saas-stack",
    title: "Provision a SaaS Stack",
    goal: "Stand up a working multi-tier service (frontend + API + DB) within budget.",
    budget_cents: 5000,
    currency: "usd",
    allowed_tools: ["web_search", "deploy", "code_exec", "stripe_checkout"],
    policy: { spend_cap_cents: 5000, approval_threshold_cents: 2000, forbidden_tools: ["transfer"] },
    time_limit_seconds: 3600,
    success_check: { type: "service_up", params: { min_uptime_seconds: 60 } },
    scoring_weights: { task_success: 0.35, roi: 0.15, cost: 0.2, quality: 0.15, time: 0.1, policy: 0.05 },
  },
  {
    id: "run-an-eval",
    title: "Run an Eval Under Budget",
    goal: "Execute a model eval suite and optimize cost/latency/quality under a fixed cap.",
    budget_cents: 8000,
    currency: "usd",
    allowed_tools: ["web_search", "code_exec", "stripe_checkout"],
    policy: { spend_cap_cents: 8000, approval_threshold_cents: 3000, forbidden_tools: [] },
    time_limit_seconds: 7200,
    success_check: { type: "eval_complete", params: { min_models: 2 } },
    scoring_weights: { task_success: 0.3, roi: 0.1, cost: 0.25, quality: 0.2, time: 0.1, policy: 0.05 },
  },
  {
    id: "source-hardware-kit",
    title: "Source a Hardware Kit",
    goal: "Find a complete, compatible parts list for a small cluster within budget.",
    budget_cents: 10000,
    currency: "usd",
    allowed_tools: ["web_search", "stripe_checkout"],
    policy: { spend_cap_cents: 10000, approval_threshold_cents: 4000, forbidden_tools: ["deploy"] },
    time_limit_seconds: 5400,
    success_check: { type: "parts_listed", params: { min_items: 5 } },
    scoring_weights: { task_success: 0.3, roi: 0.1, cost: 0.25, quality: 0.2, time: 0.1, policy: 0.05 },
  },
  {
    id: "launch-landing-page",
    title: "Launch a Paid Landing Page",
    goal: "Deploy a Stripe-test checkout page that accepts at least one payment.",
    budget_cents: 3000,
    currency: "usd",
    allowed_tools: ["web_search", "deploy", "stripe_checkout", "code_exec"],
    policy: { spend_cap_cents: 3000, approval_threshold_cents: 1000, forbidden_tools: [] },
    time_limit_seconds: 2400,
    success_check: { type: "checkout_hit", params: { min_payments: 1 } },
    scoring_weights: { task_success: 0.4, roi: 0.2, cost: 0.15, quality: 0.15, time: 0.05, policy: 0.05 },
  },
  {
    id: "reduce-cloud-bill",
    title: "Reduce a Cloud / API Bill",
    goal: "Given a simulated bill, propose and apply savings to cut cost by at least 20%.",
    budget_cents: 2000,
    currency: "usd",
    allowed_tools: ["web_search", "code_exec"],
    policy: { spend_cap_cents: 2000, approval_threshold_cents: 1000, forbidden_tools: ["stripe_checkout"] },
    time_limit_seconds: 1800,
    success_check: { type: "savings_achieved", params: { min_reduction_pct: 20 } },
    scoring_weights: { task_success: 0.35, roi: 0.15, cost: 0.2, quality: 0.15, time: 0.1, policy: 0.05 },
  },
];

// --- 3 Contestants (varied kinds, §10.2) ---

export const contestants: Contestant[] = [
  { id: "agent-surface", name: "Surface (builder re-entered)", kind: "hermes_profile" },
  { id: "engine-bot", name: "Engine Bot", kind: "hermes_profile" },
  { id: "external-agent", name: "External Evaluator", kind: "external", endpoint: "https://eval.example.com/agent" },
];

// --- 3 Runs (one running, two complete, §10.3) ---

export const runs: Run[] = [
  {
    id: "run_001",
    challenge_id: "fund-yourself",
    contestant_id: "agent-surface",
    status: "running",
    started_at: "2026-06-21T16:00:00.000Z",
    ended_at: null,
    wallet: { start_cents: 2500, balance_cents: 2500, currency: "usd" },
    live: true,
  },
  {
    id: "run_002",
    challenge_id: "fund-yourself",
    contestant_id: "engine-bot",
    status: "complete",
    started_at: "2026-06-21T16:00:00.000Z",
    ended_at: "2026-06-21T16:45:00.000Z",
    wallet: { start_cents: 2500, balance_cents: 2100, currency: "usd" },
    live: false,
  },
  {
    id: "run_003",
    challenge_id: "run-an-eval",
    contestant_id: "external-agent",
    status: "complete",
    started_at: "2026-06-21T16:00:00.000Z",
    ended_at: "2026-06-21T16:30:00.000Z",
    wallet: { start_cents: 5000, balance_cents: 4300, currency: "usd" },
    live: false,
  },
];

// --- 24 TraceEvents (mixed types, sequential seq per run, §10.4) ---

export const traceEvents: TraceEvent[] = [
  // run_001 (8 events)
  { run_id: "run_001", seq: 1, ts: "2026-06-21T16:00:00.000Z", type: "decision", summary: "Analyze challenge requirements", data: { result: { goal_understood: true } } },
  { run_id: "run_001", seq: 2, ts: "2026-06-21T16:00:30.000Z", type: "tool_call", summary: "Search monetization ideas", data: { tool: "web_search", args: { query: "make money stripe test" }, result: { count: 3 } } },
  { run_id: "run_001", seq: 3, ts: "2026-06-21T16:01:00.000Z", type: "decision", summary: "Select landing-page service as MVP", data: { result: { chosen: "landing-page" } } },
  { run_id: "run_001", seq: 4, ts: "2026-06-21T16:01:30.000Z", type: "tool_call", summary: "Create Stripe-test checkout link", data: { tool: "stripe_checkout", args: { mode: "payment" }, result: { url: "https://checkout.stripe.com/c/test_001" } } },
  { run_id: "run_001", seq: 5, ts: "2026-06-21T16:02:00.000Z", type: "spend", summary: "Charge $5.00 for test hosting", data: { tool: "stripe_checkout", args: { amount_cents: 500 } } },
  { run_id: "run_001", seq: 6, ts: "2026-06-21T16:10:00.000Z", type: "artifact", summary: "Landing page deployed", data: { result: { url: "https://fund-yourself.example.com" } } },
  { run_id: "run_001", seq: 7, ts: "2026-06-21T16:12:00.000Z", type: "tool_call", summary: "Verify checkout endpoint", data: { tool: "code_exec", args: { script: "fetch checkout_url" }, result: { status: 200 } } },
  { run_id: "run_001", seq: 8, ts: "2026-06-21T16:15:00.000Z", type: "decision", summary: "Optimize pricing for margin", data: { result: { new_price_cents: 700 } } },

  // run_002 (8 events)
  { run_id: "run_002", seq: 1, ts: "2026-06-21T16:00:00.000Z", type: "decision", summary: "Review SaaS stack challenge", data: { result: { ready: true } } },
  { run_id: "run_002", seq: 2, ts: "2026-06-21T16:00:30.000Z", type: "tool_call", summary: "Search SaaS templates", data: { tool: "web_search", args: { query: "saas boilerplate open source" }, result: { candidates: 5 } } },
  { run_id: "run_002", seq: 3, ts: "2026-06-21T16:01:00.000Z", type: "tool_call", summary: "Deploy backend service", data: { tool: "deploy", args: { service: "node-api" }, result: { host: "render.com" } } },
  { run_id: "run_002", seq: 4, ts: "2026-06-21T16:05:00.000Z", type: "spend", summary: "Deployment compute charged", data: { tool: "stripe_checkout", args: { amount_cents: 400 } } },
  { run_id: "run_002", seq: 5, ts: "2026-06-21T16:10:00.000Z", type: "artifact", summary: "API health check passes", data: { result: { status: "healthy" } } },
  { run_id: "run_002", seq: 6, ts: "2026-06-21T16:15:00.000Z", type: "tool_call", summary: "Attach test-mode subscription", data: { tool: "stripe_checkout", args: { mode: "subscription" }, result: { sub_id: "sub_test_456" } } },
  { run_id: "run_002", seq: 7, ts: "2026-06-21T16:20:00.000Z", type: "decision", summary: "Decide to close run early", data: { result: { estimated_savings_cents: 300 } } },
  { run_id: "run_002", seq: 8, ts: "2026-06-21T16:25:00.000Z", type: "artifact", summary: "Final summary doc produced", data: { result: { pages: 2 } } },

  // run_003 (8 events)
  { run_id: "run_003", seq: 1, ts: "2026-06-21T16:00:00.000Z", type: "decision", summary: "Plan eval matrix", data: { result: { models: 3 } } },
  { run_id: "run_003", seq: 2, ts: "2026-06-21T16:00:30.000Z", type: "tool_call", summary: "Fetch benchmark datasets", data: { tool: "web_search", args: { query: "open eval dataset" }, result: { found: true } } },
  { run_id: "run_003", seq: 3, ts: "2026-06-21T16:01:00.000Z", type: "tool_call", summary: "Run first model inference", data: { tool: "code_exec", args: { model: "llama-3-8b" }, result: { latency_ms: 1200 } } },
  { run_id: "run_003", seq: 4, ts: "2026-06-21T16:05:00.000Z", type: "spend", summary: "Pay for API inference", data: { tool: "stripe_checkout", args: { amount_cents: 500 } } },
  { run_id: "run_003", seq: 5, ts: "2026-06-21T16:10:00.000Z", type: "tool_call", summary: "Run second model inference", data: { tool: "code_exec", args: { model: "mistral-7b" }, result: { latency_ms: 900 } } },
  { run_id: "run_003", seq: 6, ts: "2026-06-21T16:15:00.000Z", type: "spend", summary: "Pay for second inference", data: { tool: "stripe_checkout", args: { amount_cents: 300 } } },
  { run_id: "run_003", seq: 7, ts: "2026-06-21T16:20:00.000Z", type: "artifact", summary: "Scorecard generated", data: { result: { file: "scorecard.pdf" } } },
  { run_id: "run_003", seq: 8, ts: "2026-06-21T16:25:00.000Z", type: "decision", summary: "Conclude eval with savings recommendation", data: { result: { recommendation: "reduce temperature" } } },
] as TraceEvent[];

// --- 9 Receipts (coherent running balance per run, §10.5) ---

export const receipts: Receipt[] = [
  // run_001 (starts at 2500)
  { run_id: "run_001", ts: "2026-06-21T16:02:30.000Z", kind: "charge", amount_cents: 500, currency: "usd", purpose: "Stripe-test hosting fee", stripe_ref: "cs_test_01A1", balance_after_cents: 2000 },
  { run_id: "run_001", ts: "2026-06-21T16:05:30.000Z", kind: "charge", amount_cents: 300, currency: "usd", purpose: "API usage credit", stripe_ref: "cs_test_01A2", balance_after_cents: 1700 },
  { run_id: "run_001", ts: "2026-06-21T16:15:30.000Z", kind: "payout", amount_cents: 800, currency: "usd", purpose: "Test-mode revenue", stripe_ref: "po_test_01A3", balance_after_cents: 2500 },

  // run_002 (starts at 2500)
  { run_id: "run_002", ts: "2026-06-21T16:01:30.000Z", kind: "charge", amount_cents: 400, currency: "usd", purpose: "Compute instance", stripe_ref: "cs_test_02B1", balance_after_cents: 2100 },
  { run_id: "run_002", ts: "2026-06-21T16:05:00.000Z", kind: "charge", amount_cents: 100, currency: "usd", purpose: "Object storage", stripe_ref: "cs_test_02B2", balance_after_cents: 2000 },
  { run_id: "run_002", ts: "2026-06-21T16:10:00.000Z", kind: "charge", amount_cents: 200, currency: "usd", purpose: "Bandwidth surge", stripe_ref: "cs_test_02B3", balance_after_cents: 1800 },
  { run_id: "run_002", ts: "2026-06-21T16:25:00.000Z", kind: "payout", amount_cents: 300, currency: "usd", purpose: "Client rebate", stripe_ref: "po_test_02B4", balance_after_cents: 2100 },

  // run_003 (starts at 5000)
  { run_id: "run_003", ts: "2026-06-21T16:01:30.000Z", kind: "charge", amount_cents: 400, currency: "usd", purpose: "Infrastructure provision", stripe_ref: "cs_test_03C1", balance_after_cents: 4600 },
  { run_id: "run_003", ts: "2026-06-21T16:05:00.000Z", kind: "charge", amount_cents: 300, currency: "usd", purpose: "Data transfer", stripe_ref: "cs_test_03C2", balance_after_cents: 4300 },
];

// --- 3 ScoreResult/Leaderboard rows (ranks 1-3, all dimensions, §10.6) ---

export const scoreResults: ScoreResult[] = [
  {
    run_id: "run_001",
    challenge_id: "fund-yourself",
    contestant_id: "agent-surface",
    dimensions: {
      task_success: 0.9,
      money_left_cents: 2500,
      roi: 1.2,
      quality: 0.85,
      time_seconds: 1200,
      policy_violations: 0,
      auditability: 0.95,
    },
    total: 0.88,
    rank: 1,
  },
  {
    run_id: "run_002",
    challenge_id: "fund-yourself",
    contestant_id: "engine-bot",
    dimensions: {
      task_success: 0.7,
      money_left_cents: 2100,
      roi: 0.8,
      quality: 0.75,
      time_seconds: 2400,
      policy_violations: 0,
      auditability: 0.9,
    },
    total: 0.72,
    rank: 2,
  },
  {
    run_id: "run_003",
    challenge_id: "run-an-eval",
    contestant_id: "external-agent",
    dimensions: {
      task_success: 0.75,
      money_left_cents: 4300,
      roi: 0.5,
      quality: 0.7,
      time_seconds: 1800,
      policy_violations: 1,
      auditability: 0.8,
    },
    total: 0.65,
    rank: 3,
  },
];

// --- 1 PolicyDecision example (§10.7) ---

export const policyDecision: PolicyDecision = {
  allowed: true,
  reason: "Within spend cap and allowed tools list.",
  requires_approval: false,
};

// --- Accessors (task-required) ---

export const fixtures = {
  challenges,
  contestants,
  getRun(id: string): Run | undefined {
    return runs.find((r) => r.id === id);
  },
  getTraceEvents(runId: string): TraceEvent[] {
    return traceEvents.filter((t) => t.run_id === runId);
  },
  getReceipts(runId: string): Receipt[] {
    return receipts.filter((r) => r.run_id === runId);
  },
  leaderboard(challengeId: string): ScoreResult[] {
    return scoreResults.filter((s) => s.challenge_id === challengeId);
  },
  // Backward-compatible arrays used by existing API routes
  runs,
  traceEvents,
  receipts,
  scoreResults,
};
