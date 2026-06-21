import Database from "better-sqlite3";
import { getDb } from "./db";
import type { ScoreResult } from "./types";

export function scoreRun(runId: string): ScoreResult | null {
  const db = getDb();

  const run = db.prepare("SELECT * FROM runs WHERE id = ?").get(runId) as {
    id: string;
    challenge_id: string;
    contestant_id: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    wallet_start_cents: number;
    wallet_balance_cents: number;
    wallet_currency: string;
    live: number;
  } | null;

  if (!run || !run.ended_at) {
    return null;
  }

  const started = new Date(run.started_at).getTime();
  const ended = new Date(run.ended_at).getTime();
  const timeSeconds = Math.max(0, Math.round((ended - started) / 1000));

  const challenge = db
    .prepare("SELECT * FROM challenges WHERE id = ?")
    .get(run.challenge_id) as { time_limit_seconds: number } | undefined;

  const timeLimit = challenge ? challenge.time_limit_seconds : 0;

  // Minimal scoring against §10.6
  const dimensions = {
    task_success: run.status === "complete" ? 1.0 : 0.0,
    money_left_cents: run.wallet_balance_cents,
    roi: run.wallet_balance_cents / Math.max(run.wallet_start_cents, 1),
    quality: 0.5,
    time_seconds: timeSeconds,
    policy_violations: 0,
    auditability: 0.8,
  };

  const total =
    (dimensions.task_success + dimensions.roi + dimensions.quality + dimensions.auditability) /
    4;

  const result: ScoreResult = {
    run_id: runId,
    challenge_id: run.challenge_id,
    contestant_id: run.contestant_id,
    dimensions,
    total: Math.round(total * 100) / 100,
    rank: 0,
  };

  db.prepare(
    `INSERT OR REPLACE INTO scores (run_id, challenge_id, contestant_id, dimensions, total, rank)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    runId,
    result.challenge_id,
    result.contestant_id,
    JSON.stringify(dimensions),
    result.total,
    result.rank
  );

  return result;
}
