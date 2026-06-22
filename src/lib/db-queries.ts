import Database from "better-sqlite3";
import type {
  Challenge,
  Contestant,
  Run,
  TraceEvent,
  Receipt,
  ScoreResult,
} from "./types";

export function getChallenges(db: Database.Database): Challenge[] {
  const rows = db.prepare("SELECT * FROM challenges").all() as any[];
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    goal: row.goal,
    budget_cents: row.budget_cents,
    currency: row.currency,
    allowed_tools: JSON.parse(row.allowed_tools),
    policy: JSON.parse(row.policy),
    time_limit_seconds: row.time_limit_seconds,
    success_check: JSON.parse(row.success_check),
    scoring_weights: JSON.parse(row.scoring_weights),
  }));
}

export function getChallengeById(db: Database.Database, id: string): Challenge | null {
  const row = db.prepare("SELECT * FROM challenges WHERE id = ?").get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    goal: row.goal,
    budget_cents: row.budget_cents,
    currency: row.currency,
    allowed_tools: JSON.parse(row.allowed_tools),
    policy: JSON.parse(row.policy),
    time_limit_seconds: row.time_limit_seconds,
    success_check: JSON.parse(row.success_check),
    scoring_weights: JSON.parse(row.scoring_weights),
  };
}

export function getContestants(db: Database.Database): Contestant[] {
  const rows = db.prepare("SELECT * FROM contestants").all() as any[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    endpoint: row.endpoint ?? undefined,
  }));
}

export function getContestantById(db: Database.Database, id: string): Contestant | null {
  const row = db.prepare("SELECT * FROM contestants WHERE id = ?").get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    endpoint: row.endpoint ?? undefined,
  };
}

export function getRuns(db: Database.Database, challengeId?: string): Run[] {
  let rows: any[];
  if (challengeId) {
    rows = db.prepare("SELECT * FROM runs WHERE challenge_id = ? ORDER BY started_at DESC").all(challengeId) as any[];
  } else {
    rows = db.prepare("SELECT * FROM runs ORDER BY started_at DESC").all() as any[];
  }
  return rows.map((row) => ({
    id: row.id,
    challenge_id: row.challenge_id,
    contestant_id: row.contestant_id,
    status: row.status,
    started_at: row.started_at,
    ended_at: row.ended_at,
    wallet: {
      start_cents: row.wallet_start_cents,
      balance_cents: row.wallet_balance_cents,
      currency: row.wallet_currency,
    },
    live: !!row.live,
  }));
}

export function getRunById(db: Database.Database, id: string): Run | null {
  const row = db.prepare("SELECT * FROM runs WHERE id = ?").get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    challenge_id: row.challenge_id,
    contestant_id: row.contestant_id,
    status: row.status,
    started_at: row.started_at,
    ended_at: row.ended_at,
    wallet: {
      start_cents: row.wallet_start_cents,
      balance_cents: row.wallet_balance_cents,
      currency: row.wallet_currency,
    },
    live: !!row.live,
  };
}

export function getTraceEvents(db: Database.Database, runId: string): TraceEvent[] {
  const rows = db.prepare("SELECT * FROM trace_events WHERE run_id = ? ORDER BY seq").all(runId) as any[];
  return rows.map((row) => ({
    run_id: row.run_id,
    seq: row.seq,
    ts: row.ts,
    type: row.type,
    summary: row.summary,
    data: JSON.parse(row.data),
  }));
}

export function getReceipts(db: Database.Database, runId?: string): Receipt[] {
  let rows: any[];
  if (runId) {
    rows = db.prepare("SELECT * FROM receipts WHERE run_id = ? ORDER BY ts").all(runId) as any[];
  } else {
    rows = db.prepare("SELECT * FROM receipts ORDER BY ts").all() as any[];
  }
  return rows.map((row) => ({
    run_id: row.run_id,
    ts: row.ts,
    kind: row.kind,
    amount_cents: row.amount_cents,
    currency: row.currency,
    purpose: row.purpose,
    stripe_ref: row.stripe_ref,
    balance_after_cents: row.balance_after_cents,
  }));
}

export function getScores(db: Database.Database, challengeId?: string): ScoreResult[] {
  let rows: any[];
  if (challengeId) {
    rows = db
      .prepare("SELECT * FROM scores WHERE challenge_id = ? ORDER BY rank ASC, total DESC")
      .all(challengeId) as any[];
  } else {
    rows = db.prepare("SELECT * FROM scores ORDER BY rank ASC, total DESC").all() as any[];
  }
  return rows.map((row) => ({
    run_id: row.run_id,
    challenge_id: row.challenge_id,
    contestant_id: row.contestant_id,
    dimensions: JSON.parse(row.dimensions),
    total: row.total,
    rank: row.rank,
  }));
}
