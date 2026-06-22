import { createRng } from "./seedable-rng";
import { getChallenge, listChallenges } from "./challenges";
import {
  type Run,
  type TraceEvent,
  type Receipt,
  type ScoreResult,
  type Challenge,
} from "./types";
import { decisionEvent, toolCallEvent, spendEvent, artifactEvent, type TraceContext, type RubricInputs } from "./trace-recorder";

export interface RunPlan {
  contestantId: string;
  challengeId: string;
  seed: number;
  runId: string;
  startedAt: string;
  durationSeconds: number;
  outcome: "complete" | "failed";
}

export interface SimulatedRun {
  run: Run;
  traceEvents: TraceEvent[];
  receipts: Receipt[];
  scoreResult: ScoreResult;
}

const demoRubricWeights = {
  efficiency: 0.4,
  fit: 0.35,
  compliance: 0.25,
};

function accumulationChaos(rng: ReturnType<typeof createRng>, idx: number): { efficiency: number; fit: number; compliance: number } {
  const eff = 0.1 + rng.next() * 0.9;
  const fit = 0.1 + rng.next() * 0.9;
  const compl = rng.next() < 0.95 ? 0.8 + rng.next() * 0.2 : rng.next() * 0.4;
  return {
    efficiency: Math.round(eff * 100) / 100,
    fit: Math.round(fit * 100) / 100,
    compliance: Math.round(Math.min(1, compl) * 100) / 100,
  };
}

const eventTemplates: Record<string, { kind: string; text: string; tool?: string; summary?: string }[]> = {
  "fund-yourself": [
    { kind: "decision", text: "Analyze self-funding options" },
    { kind: "tool_call", text: "Search micro-gig opportunities", tool: "web_search" },
    { kind: "tool_call", text: "Inspect Stripe test-mode docs", tool: "web_search" },
    { kind: "decision", text: "Select landing-page MVP", summary: "Select landing-page MVP" },
    { kind: "tool_call", text: "Create Checkout link", tool: "stripe_checkout" },
    { kind: "spend", text: "Charge for domain registration" },
    { kind: "tool_call", text: "Deploy static site", tool: "deploy" },
    { kind: "spend", text: "Charge for compute runtime" },
    { kind: "artifact", text: "Landing page live" },
    { kind: "tool_call", text: "Run smoke tests", tool: "code_exec" },
    { kind: "decision", text: "Optimize pricing for fast ROI" },
    { kind: "spend", text: "Charge for CDN egress" },
    { kind: "artifact", text: "Order confirmation page rendered" },
  ],
  "provision-saas-stack": [
    { kind: "decision", text: "Pick managed Postgres + serverless frontend" },
    { kind: "tool_call", text: "Search SaaS templates", tool: "web_search" },
    { kind: "tool_call", text: "Deploy backend service", tool: "deploy" },
    { kind: "spend", text: "Charge for managed DB instance" },
    { kind: "spend", text: "Charge for container runtime" },
    { kind: "artifact", text: "API health check passes" },
    { kind: "tool_call", text: "Run integration smoke tests", tool: "code_exec" },
    { kind: "spend", text: "Charge for CDN egress" },
    { kind: "artifact", text: "Landing page reachable" },
    { kind: "tool_call", text: "Attach test subscription", tool: "stripe_checkout" },
    { kind: "spend", text: "Charge for log storage" },
    { kind: "artifact", text: "README with endpoints" },
  ],
  "run-an-eval": [
    { kind: "decision", text: "Plan eval matrix" },
    { kind: "tool_call", text: "Fetch benchmark datasets", tool: "web_search" },
    { kind: "tool_call", text: "Run first model inference", tool: "code_exec" },
    { kind: "spend", text: "Charge for inference API calls" },
    { kind: "spend", text: "Charge for dataset download" },
    { kind: "tool_call", text: "Run second model inference", tool: "code_exec" },
    { kind: "spend", text: "Charge for compute runtime" },
    { kind: "artifact", text: "Scorecard JSON generated" },
    { kind: "tool_call", text: "Plot latency histograms", tool: "code_exec" },
    { kind: "artifact", text: "Plots saved under /artifacts" },
    { kind: "decision", text: "Conclude eval with savings recommendation" },
    { kind: "artifact", text: "Summary report passed" },
  ],
};

const fallbackTemplate = [
  { kind: "decision", text: "Scope the task" },
  { kind: "tool_call", text: "Search references", tool: "web_search" },
  { kind: "decision", text: "Pick implementation approach" },
  { kind: "tool_call", text: "Build solution", tool: "code_exec" },
  { kind: "spend", text: "Charge for primary resource" },
  { kind: "artifact", text: "Artifact produced" },
  { kind: "tool_call", text: "Verify output", tool: "code_exec" },
  { kind: "decision", text: "Finalize delivery" },
];

function spendAmount(budget: number, rng: ReturnType<typeof createRng>) {
  return Math.round((50 + rng.next() * 900) / 10) * 10;
}

export function buildRun(plan: RunPlan): SimulatedRun {
  const challenge = getChallenge(plan.challengeId);
  if (!challenge) throw new Error(`Challenge not found: ${plan.challengeId}`);
  const rng = createRng(plan.seed);

  const runId = plan.runId;
  const startedAt = plan.startedAt;
  const endedAt = new Date(new Date(startedAt).getTime() + plan.durationSeconds * 1000).toISOString();

  const run: Run = {
    id: runId,
    challenge_id: plan.challengeId,
    contestant_id: plan.contestantId,
    status: plan.outcome,
    started_at: startedAt,
    ended_at: endedAt,
    wallet: {
      start_cents: challenge.budget_cents,
      balance_cents: challenge.budget_cents,
      currency: challenge.currency,
    },
    live: false,
  };

  const templates = eventTemplates[plan.challengeId] || fallbackTemplate;
  const numEvents = 12 + rng.int(0, 8);
  const traceEvents: TraceEvent[] = [];
  const receipts: Receipt[] = [];
  let balance = challenge.budget_cents;

  const productPick = rng.choice(["landing-page", "managed-api", "static-site", "checkout-flow"]);
  const productPickEvent = { product: productPick, rationale: `Seed ${plan.seed} selected ${productPick} for cost/latency.` };
  let productPickEmitted = false;

  for (let i = 0; i < numEvents; i++) {
    const tmpl = rng.choice(templates);
    const ts = new Date(new Date(startedAt).getTime() + ((i * plan.durationSeconds * 1000) / numEvents)).toISOString();
    const seq = i + 1;
    const rubric = accumulationChaos(rng, i);
    const ctx: TraceContext = { runId, seq, ts };

    if (tmpl.kind === "tool_call") {
      const text = tmpl.summary || tmpl.text;
      const evt = toolCallEvent(ctx, tmpl.tool || "code_exec", {}, text);
      evt.data.rubric_inputs = rubric;
      traceEvents.push(evt);
    } else if (tmpl.kind === "spend") {
      const amount = spendAmount(challenge.budget_cents, rng);
      const evt = spendEvent(ctx, amount, balance, tmpl.text);
      evt.data.rubric_inputs = rubric;
      balance -= amount;
      traceEvents.push(evt);
      receipts.push({
        run_id: runId,
        ts,
        kind: "charge",
        amount_cents: amount,
        currency: challenge.currency,
        purpose: tmpl.text.replace(/Charge for /, ""),
        stripe_ref: `cs_test_${plan.seed}_${seq}`,
        balance_after_cents: balance,
      });
      run.wallet.balance_cents = balance;
    } else if (tmpl.kind === "decision") {
      const text = tmpl.summary || tmpl.text;
      const includeProduct = !productPickEmitted;
      if (includeProduct) productPickEmitted = true;
      const evt = decisionEvent(ctx, text, {
        ...(includeProduct ? { product_pick: productPickEvent } : {}),
      });
      evt.data.rubric_inputs = rubric;
      traceEvents.push(evt);
    } else {
      const evt = artifactEvent(ctx, tmpl.text, {});
      evt.data.rubric_inputs = rubric;
      traceEvents.push(evt);
    }
  }

  if (plan.outcome === "complete" && rng.next() < 0.7) {
    const payoutAmount = Math.round((challenge.budget_cents - run.wallet.balance_cents) * 0.5);
    if (payoutAmount > 0) {
      balance += payoutAmount;
      run.wallet.balance_cents = balance;
      receipts.push({
        run_id: runId,
        ts: endedAt,
        kind: "payout",
        amount_cents: payoutAmount,
        currency: challenge.currency,
        purpose: "Test-mode revenue",
        stripe_ref: `po_test_${plan.seed}`,
        balance_after_cents: balance,
      });
    }
  }

  const scoreResult: ScoreResult = {
    run_id: runId,
    challenge_id: plan.challengeId,
    contestant_id: plan.contestantId,
    dimensions: {
      task_success: plan.outcome === "complete" ? "pass" : "fail",
      money_left_cents: run.wallet.balance_cents,
      roi: 0,
      quality: 0,
      time_seconds: plan.durationSeconds,
      policy_violations: 0,
      auditability: 1.0,
    },
    total: 0,
    rank: 0,
  };

  return { run, traceEvents, receipts, scoreResult };
}
