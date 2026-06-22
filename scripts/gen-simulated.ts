import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import {
  ChallengeSchema,
  RunSchema,
  TraceEventSchema,
  ReceiptSchema,
  ScoreResultSchema,
} from "../src/lib/types";
import { challenges } from "../src/data/challenges";

const targetChallenges = challenges.slice(1, 6);

const outDir = path.resolve("src/data/simulated");
fs.mkdirSync(outDir, { recursive: true });

const agentNames = [
  "ops-agent-7",
  "budget-watcher",
  "greedy-gpt",
  "saas-builder",
  "eval-runner",
  "parts-finder",
  "page-launcher",
  "bill-cutter",
  "cloud-optimizer",
  "cost-ninja",
];

let nameIndex = 0;
const nextName = () => agentNames[nameIndex++ % agentNames.length];

type OutcomeKind = "pass" | "partial" | "fail";

interface RunPlan {
  outcome: OutcomeKind;
  balanceCents: number;
  dramatic?: boolean;
  durationSeconds: number;
  violations: number;
}

function planOutcome(
  budget: number,
  outcome: OutcomeKind,
  dramatic = false
): RunPlan {
  if (outcome === "pass") {
    const factor = dramatic ? 0.98 : 1.1 + Math.random() * 0.3;
    return {
      outcome: "pass",
      balanceCents: Math.round(budget * factor),
      dramatic,
      durationSeconds: 300 + Math.floor(Math.random() * 1200),
      violations: 0,
    };
  }
  if (outcome === "partial") {
    const balance = Math.round(budget * (0.1 + Math.random() * 0.3));
    return {
      outcome: "partial",
      balanceCents: balance,
      dramatic,
      durationSeconds: 600 + Math.floor(Math.random() * 800),
      violations: 0,
    };
  }
  return {
    outcome: "fail",
    balanceCents: Math.round(budget * Math.random() * 0.15),
    dramatic,
    durationSeconds: 200 + Math.floor(Math.random() * 400),
    violations: dramatic ? 1 : Math.random() < 0.3 ? 1 : 0,
  };
}

const eventTemplates: Record<
  string,
  { kind: string; text: string; tool?: string }[]
> = {
  "provision-saas-stack": [
    { kind: "decision", text: "Pick managed Postgres + serverless frontend" },
    { kind: "tool_call", text: "Search SaaS templates", tool: "web_search" },
    { kind: "tool_call", text: "Deploy backend service", tool: "deploy" },
    { kind: "spend", text: "Charge $2.00 for managed DB instance" },
    { kind: "spend", text: "Charge $1.20 for container runtime" },
    { kind: "spend", text: "Charge $0.50 for DNS + TLS" },
    { kind: "artifact", text: "API health check passes" },
    { kind: "tool_call", text: "Run integration smoke tests", tool: "code_exec" },
    { kind: "spend", text: "Charge $1.80 for CDN egress" },
    { kind: "artifact", text: "Landing page reachable" },
    { kind: "tool_call", text: "Attach test subscription", tool: "stripe_checkout" },
    { kind: "spend", text: "Charge $0.90 for log storage" },
    { kind: "artifact", text: "README with endpoints" },
    { kind: "decision", text: "Finalize topology review" },
    { kind: "artifact", text: "Summary doc produced" },
  ],
  "run-an-eval": [
    { kind: "decision", text: "Plan eval matrix" },
    { kind: "tool_call", text: "Fetch benchmark datasets", tool: "web_search" },
    { kind: "tool_call", text: "Run first model inference", tool: "code_exec" },
    { kind: "spend", text: "Charge $3.20 for inference API calls" },
    { kind: "spend", text: "Charge $1.50 for dataset download" },
    { kind: "tool_call", text: "Run second model inference", tool: "code_exec" },
    { kind: "spend", text: "Charge $1.00 for compute runtime" },
    { kind: "artifact", text: "Scorecard JSON generated" },
    { kind: "tool_call", text: "Plot latency histograms", tool: "code_exec" },
    { kind: "artifact", text: "Plots saved under /artifacts" },
    { kind: "decision", text: "Conclude eval with savings recommendation" },
    { kind: "artifact", text: "Summary report passed" },
    { kind: "tool_call", text: "Export CSV for review", tool: "code_exec" },
    { kind: "spend", text: "Charge $0.40 for storage" },
    { kind: "artifact", text: "Artifact produced step 15" },
  ],
  "source-hardware-kit": [
    { kind: "decision", text: "Pick cluster kit approach" },
    { kind: "tool_call", text: "Search compute boards", tool: "web_search" },
    { kind: "tool_call", text: "Compare specs across SKUs", tool: "web_search" },
    { kind: "spend", text: "Charge $5.20 for compute boards" },
    { kind: "spend", text: "Charge $2.10 for power + networking" },
    { kind: "spend", text: "Charge $1.40 for storage media" },
    { kind: "artifact", text: "Bill of materials Markdown" },
    { kind: "tool_call", text: "Cross-check compatibility matrix", tool: "code_exec" },
    { kind: "artifact", text: "Compatibility checksum passed" },
    { kind: "decision", text: "Trim to fit remaining budget" },
    { kind: "artifact", text: "Supplier links saved" },
    { kind: "tool_call", text: "Run cost optimizer", tool: "code_exec" },
    { kind: "spend", text: "Charge $0.30 for shipping estimate" },
    { kind: "artifact", text: "Final parts list exported" },
    { kind: "decision", text: "Review total before checkout" },
  ],
  "launch-landing-page": [
    { kind: "decision", text: "Choose static site generator" },
    { kind: "tool_call", text: "Find themes", tool: "web_search" },
    { kind: "tool_call", text: "Scaffold repo", tool: "code_exec" },
    { kind: "tool_call", text: "Create Checkout link", tool: "stripe_checkout" },
    { kind: "spend", text: "Charge $0.80 for domain registration" },
    { kind: "spend", text: "Charge $1.20 for host deploy" },
    { kind: "artifact", text: "Homepage loads" },
    { kind: "tool_call", text: "Verify checkout endpoint", tool: "code_exec" },
    { kind: "artifact", text: "Checkout link active" },
    { kind: "spend", text: "Charge $0.30 for checkout webhook" },
    { kind: "artifact", text: "Order confirmation page rendered" },
    { kind: "tool_call", text: "Run Lighthouse audit", tool: "code_exec" },
    { kind: "spend", text: "Charge $0.50 for image CDN" },
    { kind: "artifact", text: "Sales page cached via CDN" },
    { kind: "decision", text: "Finalize price tier" },
  ],
  "reduce-cloud-bill": [
    { kind: "decision", text: "Map out line items" },
    { kind: "tool_call", text: "List invoice items", tool: "code_exec" },
    { kind: "tool_call", text: "Research discount tiers", tool: "web_search" },
    { kind: "spend", text: "Charge $0.60 for API usage analyzer" },
    { kind: "spend", text: "Charge $0.50 for savings simulation" },
    { kind: "artifact", text: "Proposal CSV generated" },
    { kind: "decision", text: "Flag redundant long-term contracts" },
    { kind: "tool_call", text: "Apply auto-scaling schedule", tool: "code_exec" },
    { kind: "artifact", text: "Savings estimate verified" },
    { kind: "tool_call", text: "Compare reserved instances", tool: "web_search" },
    { kind: "artifact", text: "Final report rendered" },
    { kind: "decision", text: "Summarize use-case workaround" },
    { kind: "artifact", text: "Slides produced for ops" },
    { kind: "tool_call", text: "Export PDF", tool: "code_exec" },
    { kind: "artifact", text: "Artifact produced step 15" },
  ],
};

function spendAmount(_budget: number): number {
  return Math.round((50 + Math.random() * 900) / 10) * 10;
}

function buildRun(
  challengeId: string,
  challenge: typeof targetChallenges[number],
  runIndex: number,
  plan: RunPlan
) {
  const contestantId = nextName();
  const runId = `${challengeId}-run-${runIndex}`;
  const startedAt = new Date(Date.now() - plan.durationSeconds * 1000).toISOString();
  const endedAt = new Date().toISOString();

  const run = {
    id: runId,
    challenge_id: challengeId,
    contestant_id: contestantId,
    status: plan.outcome === "fail" ? "failed" : "complete",
    started_at: startedAt,
    ended_at: endedAt,
    wallet: {
      start_cents: challenge.budget_cents,
      balance_cents: plan.balanceCents,
      currency: challenge.currency,
    },
    live: false,
  };

  const templates = eventTemplates[challengeId] || eventTemplates["provision-saas-stack"];
  const traceEvents: any[] = [];
  const receipts: any[] = [];
  let balance = challenge.budget_cents;
  // Use a fixed seed-like selection for variety instead of total random
  const pick = (arr: typeof templates) => arr[Math.floor(Math.random() * arr.length)];
  const numEvents = 15 + Math.floor(Math.random() * 16);

  const usedToolCalls = new Set<string>();

  for (let i = 0; i < numEvents; i++) {
    const tmpl = pick(templates);
    const ts = new Date(
      new Date(startedAt).getTime() + ((i * plan.durationSeconds * 1000) / numEvents)
    ).toISOString();
    const seq = i + 1;
    const data: Record<string, unknown> = {};

    if (tmpl.kind === "tool_call") {
      data.tool = tmpl.tool || "code_exec";
      data.args = {};
      data.result = {};
      usedToolCalls.add(data.tool as string);
    } else if (tmpl.kind === "spend") {
      const amount = spendAmount(challenge.budget_cents);
      data.tool = "stripe_checkout";
      data.args = { amount_cents: amount };
      data.result = { approved: balance - amount >= 0 };
      data.amount_cents = amount;

      balance -= amount;
      receipts.push({
        run_id: runId,
        ts,
        kind: "charge",
        amount_cents: amount,
        currency: challenge.currency,
        purpose: tmpl.text.replace(/Charge \$[\d.]+ for /, ""),
        stripe_ref: `cs_test_${crypto.randomUUID().slice(0, 8)}`,
        balance_after_cents: balance,
      });
    } else {
      data.result = {};
    }

    // dramatic refund: if flagged, insert a refund after half the events
    if (plan.dramatic && i === Math.floor(numEvents / 2) && tmpl.kind !== "spend") {
      const refundAmount = Math.min(
        Math.round(challenge.budget_cents * 0.25),
        Math.max(0, challenge.budget_cents - balance)
      );
      if (refundAmount > 0) {
        balance += refundAmount;
        receipts.push({
          run_id: runId,
          ts: new Date(new Date(ts).getTime() + 1).toISOString(),
          kind: "refund",
          amount_cents: refundAmount,
          currency: challenge.currency,
          purpose: "Mid-run refund to recover scope",
          stripe_ref: `re_test_${crypto.randomUUID().slice(0, 8)}`,
          balance_after_cents: balance,
        });
      }
    }

    traceEvents.push({
      run_id: runId,
      seq,
      ts,
      type: tmpl.kind,
      summary: tmpl.text,
      data,
    });
  }

  // occasional payout for pass/partial
  if (plan.outcome !== "fail" && Math.random() < 0.7) {
    const payoutAmount = Math.round((challenge.budget_cents - plan.balanceCents) * 0.5);
    if (payoutAmount > 0) {
      balance += payoutAmount;
      receipts.push({
        run_id: runId,
        ts: endedAt,
        kind: "payout",
        amount_cents: payoutAmount,
        currency: challenge.currency,
        purpose: "Test-mode revenue",
        stripe_ref: `po_test_${crypto.randomUUID().slice(0, 8)}`,
        balance_after_cents: balance,
      });
    }
  }

  if (traceEvents.length > 30) traceEvents.length = 30;
  if (receipts.length > 10) receipts.length = 10;

  const taskSuccessNumeric =
    plan.outcome === "pass" ? 0.9 : plan.outcome === "partial" ? 0.5 : 0.1;
  const taskSuccessRaw =
    plan.outcome === "pass"
      ? parseFloat((0.8 + Math.random() * 0.2).toFixed(2))
      : plan.outcome === "partial"
      ? parseFloat((0.3 + Math.random() * 0.3).toFixed(2))
      : parseFloat((Math.random() * 0.2).toFixed(2));
  // schema says task_success is pass|partial|fail, but numeric score is derived separately.
  // We keep the schema-valid enum for dimensions.task_success and use the numeric
  // value only for the aggregate total.
  const taskSuccessForTotal = taskSuccessNumeric;
  const roiForTotal =
    plan.outcome === "pass"
      ? parseFloat((0.1 + Math.random() * 0.9).toFixed(2))
      : plan.outcome === "partial"
      ? parseFloat((-0.2 + Math.random() * 0.3).toFixed(2))
      : parseFloat((-1 + Math.random() * 0.8).toFixed(2));
  const quality = parseFloat((0.4 + Math.random() * 0.6).toFixed(2));
  const timeSeconds = plan.durationSeconds;
  const policyViolations = plan.violations;
  const auditability = parseFloat((0.7 + Math.random() * 0.3).toFixed(2));

  const scoreResult = {
    run_id: runId,
    challenge_id: challengeId,
    contestant_id: contestantId,
    dimensions: {
      task_success: plan.outcome,
      money_left_cents: plan.balanceCents,
      roi: roiForTotal,
      quality,
      time_seconds: timeSeconds,
      policy_violations: policyViolations,
      auditability,
    },
    total: 0,
    rank: 0,
  };

  scoreResult.total = parseFloat(
    (
      taskSuccessForTotal * 0.35 +
      roiForTotal * 0.15 +
      quality * 0.15 +
      Math.max(0, 1 - timeSeconds / 10000) * 0.1 +
      Math.max(0, 1 - policyViolations / 3) * 0.1 +
      auditability * 0.15
    ).toFixed(2)
  );

  scoreResult.rank = 0;

  // Validate schemas
  RunSchema.parse(run);
  traceEvents.forEach((t) => TraceEventSchema.parse(t));
  receipts.forEach((r) => ReceiptSchema.parse(r));
  ScoreResultSchema.parse(scoreResult);

  return {
    filename: path.join(outDir, `${challengeId}-run-${runIndex}.json`),
    data: { run, traceEvents, receipts, scoreResult },
  };
}

const generated: Array<{ challengeId: string; runId: string }> = [];

for (const challenge of targetChallenges) {
  const perChallenge = 3;
  const plans: Array<{ outcome: OutcomeKind; dramatic?: boolean }> = [];
  plans.push({ outcome: "pass" });
  if (Math.random() < 0.6) plans.push({ outcome: "partial" });
  plans.push({ outcome: "fail" });
  while (plans.length < perChallenge) {
    plans.push({
      outcome: Math.random() < 0.5 ? "pass" : Math.random() < 0.6 ? "partial" : "fail",
    });
  }
  if (!plans.some((p) => p.dramatic)) {
    plans[0].dramatic = true;
  }

  for (let i = 0; i < perChallenge; i++) {
    const runIndex = i + 1;
    const plan = planOutcome(challenge.budget_cents, plans[i].outcome, !!plans[i].dramatic);
    const { filename, data } = buildRun(challenge.id, challenge, runIndex, plan);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    generated.push({ challengeId: challenge.id, runId: data.run.id });
    console.log(`wrote ${filename}`);
  }
}

console.log(`\nGenerated ${generated.length} simulated runs`);
