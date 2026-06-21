import type { Run, Challenge, TraceEvent, Receipt, ScoreResult } from "./types";

/**
 * Pure deterministic scoring engine.
 * Operates only on in-memory typed objects — no DB access.
 *
 * §10.6 dimensions + weights, no LLM.
 */
export function scoreRun(
  run: Run,
  challenge: Challenge,
  traceEvents: TraceEvent[],
  receipts: Receipt[]
): ScoreResult {
  // task_success string
  let taskSuccess: "pass" | "partial" | "fail";
  if (challenge.success_check.type === "net_positive") {
    if (run.wallet.balance_cents > run.wallet.start_cents) taskSuccess = "pass";
    else if (run.wallet.balance_cents === run.wallet.start_cents) taskSuccess = "partial";
    else taskSuccess = "fail";
  } else {
    // Default: check run.status
    if (run.status === "complete") taskSuccess = "pass";
    else if (run.status === "failed") taskSuccess = "fail";
    else taskSuccess = "partial";
  }

  const moneyLeft = run.wallet.balance_cents;

  const chargeTotal = receipts
    .filter((r) => r.kind === "charge")
    .reduce((sum, r) => sum + r.amount_cents, 0);

  const payoutTotal = receipts
    .filter((r) => r.kind === "payout")
    .reduce((sum, r) => sum + r.amount_cents, 0);

  const roi = chargeTotal === 0 ? 0 : payoutTotal / Math.max(chargeTotal, 1);

  const quality = 0.8; // placeholder for E5b LLM-judge

  const startedAt = new Date(run.started_at).getTime();
  const endedAt = run.ended_at ? new Date(run.ended_at).getTime() : Date.now();
  const timeSeconds = Math.max(0, Math.round((endedAt - startedAt) / 1000));

  const policyViolations = traceEvents.filter((e) => e.type === "policy_violation").length;

  // auditability: 1.0 if all events have valid ts and contiguously packed seq, else fractional
  let auditability = 1.0;
  if (traceEvents.length > 0) {
    const sorted = [...traceEvents].sort((a, b) => a.seq - b.seq);
    const firstSeq = sorted[0].seq;
    const lastSeq = sorted[sorted.length - 1].seq;
    const expectedCount = lastSeq - firstSeq + 1;

    const invalidTs = sorted.filter((e) => {
      const t = new Date(e.ts).getTime();
      return Number.isNaN(t);
    }).length;

    const gaps = expectedCount - sorted.length;
    const gapRatio = (gaps + invalidTs) / Math.max(expectedCount, 1);
    auditability = Math.max(0, 1.0 - gapRatio);
  }

  const taskSuccessNum = taskSuccess === "pass" ? 1.0 : taskSuccess === "partial" ? 0.5 : 0.0;
  const costNum =
    challenge.budget_cents > 0
      ? Math.max(0, Math.min(1, 1.0 - moneyLeft / challenge.budget_cents))
      : 0;
  const timeNum =
    challenge.time_limit_seconds > 0
      ? Math.max(0, Math.min(1, 1.0 - timeSeconds / challenge.time_limit_seconds))
      : 0;
  const policyNum = 1.0 / (1.0 + policyViolations);

  const total =
    taskSuccessNum * challenge.scoring_weights.task_success +
    roi * challenge.scoring_weights.roi +
    costNum * challenge.scoring_weights.cost +
    quality * challenge.scoring_weights.quality +
    timeNum * challenge.scoring_weights.time +
    policyNum * challenge.scoring_weights.policy;

  const normalizedTotal = Math.max(0.0, Math.min(1.0, total));

  const result: ScoreResult = {
    run_id: run.id,
    challenge_id: challenge.id,
    contestant_id: run.contestant_id,
    dimensions: {
      task_success: taskSuccess,
      money_left_cents: moneyLeft,
      roi: Math.round(roi * 100) / 100,
      quality,
      time_seconds: timeSeconds,
      policy_violations: policyViolations,
      auditability: Math.round(auditability * 100) / 100,
    },
    total: Math.round(normalizedTotal * 100) / 100,
    rank: 0,
  };

  return result;
}
