#!/usr/bin/env tsx

import type { Run, Challenge, TraceEvent, Receipt } from "../src/lib/types";
import {
  RunSchema,
  ChallengeSchema,
  TraceEventSchema,
  ReceiptSchema,
} from "../src/lib/types";

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round100(v: number): number {
  return Math.round(clamp(v, 0, 100));
}

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: wb-score <trace.json> | wb-score compare <trace1> [trace2] [trace3]");
    process.exit(1);
  }
  if (args[0] === "compare") {
    return { mode: "compare" as const, files: args.slice(1) };
  }
  return { mode: "single" as const, file: args[0] };
}

function loadTraceFile(path: string) {
  const raw = require("fs").readFileSync(path, "utf-8");
  const data = JSON.parse(raw);
  if (!data.run || !data.challenge || !Array.isArray(data.trace) || !Array.isArray(data.receipts)) {
    throw new Error(`Invalid trace dossier ${path}: missing run, challenge, trace, or receipts.`);
  }
  const run = RunSchema.parse(data.run) as Run;
  const challenge = ChallengeSchema.parse(data.challenge) as Challenge;
  const trace = data.trace.map((t: unknown) => TraceEventSchema.parse(t) as TraceEvent);
  const receipts = data.receipts.map((r: unknown) => ReceiptSchema.parse(r) as Receipt);
  return { run, challenge, trace, receipts };
}

function computeSuccess(challenge: Challenge, run: Run): "pass" | "partial" | "fail" {
  if (challenge.success_check.type === "net_positive") {
    if (run.wallet.balance_cents > run.wallet.start_cents) return "pass";
    if (run.wallet.balance_cents === run.wallet.start_cents) return "partial";
    return "fail";
  }
  if (run.status === "complete") return "pass";
  if (run.status === "failed") return "fail";
  return "partial";
}

function computeTimeSeconds(run: Run): number {
  const start = new Date(run.started_at).getTime();
  const end = run.ended_at ? new Date(run.ended_at).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / 1000));
}

function computeAuditability(trace: TraceEvent[]): number {
  if (trace.length === 0) return 1.0;
  const sorted = [...trace].sort((a, b) => a.seq - b.seq);
  const firstSeq = sorted[0].seq;
  const lastSeq = sorted[sorted.length - 1].seq;
  const expectedCount = lastSeq - firstSeq + 1;
  const invalidTs = sorted.filter((e) => Number.isNaN(new Date(e.ts).getTime())).length;
  const gaps = expectedCount - sorted.length;
  const gapRatio = (gaps + invalidTs) / Math.max(expectedCount, 1);
  return Math.max(0, Math.min(1, 1 - gapRatio));
}

interface RubricScore {
  costEfficiency: number;
  productFit: number;
  compliance: number;
  total: number;
}

function scoreTrace(run: Run, challenge: Challenge, trace: TraceEvent[], receipts: Receipt[]): RubricScore {
  const taskSuccess = computeSuccess(challenge, run);
  const taskSuccessNum = taskSuccess === "pass" ? 100 : taskSuccess === "partial" ? 50 : 0;

  const chargeTotal = receipts.filter((r) => r.kind === "charge").reduce((sum, r) => sum + r.amount_cents, 0);
  const payoutTotal = receipts.filter((r) => r.kind === "payout").reduce((sum, r) => sum + r.amount_cents, 0);
  const roi = chargeTotal === 0 ? 0 : payoutTotal / Math.max(chargeTotal, 1);

  const timeSeconds = computeTimeSeconds(run);
  const timeLimit = challenge.time_limit_seconds || 1;
  const timeScore = clamp(100 * (1 - timeSeconds / timeLimit), 0, 100);

  const policyViolations = trace.filter((e) => e.type === "policy_violation").length;
  const auditability = computeAuditability(trace);

  const artifactCount = trace.filter((e) => e.type === "artifact").length;
  const qualityFromArtifacts = clamp((artifactCount / Math.max(trace.length, 1)) * 20, 0, 1);
  const quality = round100(0.5 + 0.5 * qualityFromArtifacts);
  const safeQuality = trace.length === 0 ? 50 : quality;

  const productFit = round100(0.40 * taskSuccessNum + 0.25 * safeQuality + 0.35 * timeScore);

  const start = run.wallet.start_cents || 1;
  const moneyLeft = run.wallet.balance_cents;
  const moneyEff = clamp(100 * (moneyLeft / start), 0, 100);
  const roiEff = clamp(50 + 50 * roi, 0, 100);
  const costEfficiency = round100(0.50 * moneyEff + 0.50 * roiEff);

  const compliance = round100(0.50 * (1.0 / (1.0 + policyViolations)) * 100 + 0.50 * auditability * 100);

  const total = round100(0.40 * costEfficiency + 0.35 * productFit + 0.25 * compliance);

  return { costEfficiency, productFit, compliance, total };
}

function printSingle(path: string) {
  const { run, challenge, trace, receipts } = loadTraceFile(path);
  const score = scoreTrace(run, challenge, trace, receipts);
  const contestantName = (run as any).contestant_id ?? require("path").basename(path, ".json");
  const { costEfficiency, productFit, compliance, total } = score;

  console.log(`RUBRIC SCORE — ${contestantName}`);
  console.log(`Challenge: ${challenge.title}`);
  if ((run as any).id) console.log(`Run:       ${(run as any).id}`);
  console.log();
  console.log("──────────────────────────────────────────────────────────────────");
  console.log("Dimension          Weight   Score");
  console.log("──────────────────────────────────────────────────────────────────");
  console.log(`Cost-efficiency    40%      ${costEfficiency.toString().padStart(3)}/100`);
  console.log(`Product-fit        35%      ${productFit.toString().padStart(3)}/100`);
  console.log(`Compliance         25%      ${compliance.toString().padStart(3)}/100`);
  console.log("──────────────────────────────────────────────────────────────────");
  console.log(`TOTAL                       ${total.toString().padStart(3)}/100`);
}

function printCompare(files: string[]) {
  if (files.length === 0) {
    console.error("compare expects at least one trace file.");
    process.exit(1);
  }

  const rows = files.map((f) => {
    const { run, challenge, trace, receipts } = loadTraceFile(f);
    const score = scoreTrace(run, challenge, trace, receipts);
    const name =
      (challenge as any).contestants?.find((c: any) => c.id === run.contestant_id)?.name ??
      run.contestant_id ??
      require("path").basename(f, ".json");
    return {
      name: name as string,
      total: score.total,
      costEfficiency: score.costEfficiency,
      productFit: score.productFit,
      compliance: score.compliance,
    };
  });

  rows.sort((a, b) => b.total - a.total);

  console.log("COMPARE");
  console.log("──────────────────────────────────────────────────────────────────────────────");
  console.log("Rank  Contestant               Total   Cost-eff  Product-fit  Compliance");
  console.log("──────────────────────────────────────────────────────────────────────────────");
  rows.forEach((r, i) => {
    const rank = (i + 1).toString().padStart(4);
    const name = r.name.padEnd(24);
    const total = r.total.toString().padStart(5);
    const ce = r.costEfficiency.toString().padStart(8);
    const pf = r.productFit.toString().padStart(10);
    const co = r.compliance.toString().padStart(10);
    console.log(`${rank}  ${name}${total}   ${ce}   ${pf}   ${co}`);
  });
  console.log("──────────────────────────────────────────────────────────────────────────────");
  console.log(`WINNER: ${rows[0].name} (${rows[0].total}/100)`);
}

function main() {
  const { mode, file, files } = parseArgs(process.argv);
  if (mode === "single") {
    printSingle(file);
  } else {
    printCompare(files);
  }
}

main();
