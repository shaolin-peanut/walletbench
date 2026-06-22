import type { Run, Challenge, TraceEvent, Receipt, ScoreResult } from "./types";

/**
 * Call an LLM judge to evaluate an artifact against a rubric.
 *
 * Env:
 *   LLM_JUDGE_API_URL — POST endpoint. Body: { artifactData, rubric }.
 *   Falls back to 0.5 (neutral) with a warning when unset or on error.
 */
export async function judgeArtifactQuality(
  artifactData: object,
  rubric: string
): Promise<number> {
  const apiUrl = process.env.LLM_JUDGE_API_URL;

  if (!apiUrl) {
    console.warn("[judgeArtifactQuality] No LLM_JUDGE_API_URL configured; returning neutral 0.5");
    return 0.5;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artifactData,
        rubric,
        prompt:
          `Evaluate the artifact against the rubric below. ` +
          `Return ONLY a single numeric score between 0.0 and 1.0.\n\n` +
          `Rubric: ${rubric}\n\n` +
          `Artifact: ${JSON.stringify(artifactData)}`,
      }),
    });

    if (!response.ok) {
      console.warn(
        `[judgeArtifactQuality] LLM API returned ${response.status}; returning neutral 0.5`
      );
      return 0.5;
    }

    const contentType = response.headers.get("content-type") || "";
    let score: number | undefined;

    if (contentType.includes("application/json")) {
      const body = (await response.json()) as Record<string, unknown>;

      if (typeof body.score === "number") {
        score = body.score;
      } else if (
        Array.isArray(body.choices) &&
        body.choices.length > 0 &&
        typeof (body.choices[0] as Record<string, unknown>).message === "object"
      ) {
        const msg = (body.choices[0] as Record<string, unknown>).message as Record<string, unknown>;
        if (typeof msg.content === "string") {
          score = extractScoreFromText(msg.content);
        }
      }
    } else {
      const text = await response.text();
      score = extractScoreFromText(text);
    }

    if (score === undefined || Number.isNaN(score)) {
      console.warn(`[judgeArtifactQuality] Could not parse score from LLM response; returning neutral 0.5`);
      return 0.5;
    }

    return Math.max(0.0, Math.min(1.0, score));
  } catch (err) {
    console.warn(
      `[judgeArtifactQuality] LLM call failed: ${err instanceof Error ? err.message : String(err)}; returning neutral 0.5`
    );
    return 0.5;
  }
}

function extractScoreFromText(text: string): number | undefined {
  // Look for a standalone decimal/float in the text
  const match = text.match(/\b(0(?:\.\d+)?|1(?:\.0+)?)\b/);
  if (match) {
    return parseFloat(match[1]);
  }
  return undefined;
}

/**
 * Pure deterministic scoring engine.
 * Operates only on in-memory typed objects — no DB access.
 *
 * §10.6 dimensions + weights, with LLM-judge quality for artifacts.
 */
export async function scoreRun(
  run: Run,
  challenge: Challenge,
  traceEvents: TraceEvent[],
  receipts: Receipt[]
): Promise<ScoreResult> {
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

  // LLM-judge quality: evaluate artifacts when present
  const artifactEvents = traceEvents.filter((e) => e.type === "artifact");
  let quality: number;
  if (artifactEvents.length > 0) {
    const rubric = `Evaluate how well the artifact serves the challenge goal: ${challenge.goal}`;
    // Use the first artifact's result as the primary artifact data
    const artifactData =
      (artifactEvents[0].data.result as object) ?? artifactEvents[0].data;
    quality = await judgeArtifactQuality(artifactData, rubric);
  } else {
    quality = 0.5;
  }

  const startedAt = new Date(run.started_at).getTime();
  const endedAt = run.ended_at
    ? new Date(run.ended_at).getTime()
    : startedAt + challenge.time_limit_seconds * 1000;
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
      quality: Math.round(quality * 100) / 100,
      time_seconds: timeSeconds,
      policy_violations: policyViolations,
      auditability: Math.round(auditability * 100) / 100,
    },
    total: Math.round(normalizedTotal * 100) / 100,
    rank: 0,
  };

  return result;
}
