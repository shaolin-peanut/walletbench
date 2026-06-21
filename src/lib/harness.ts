import Database from "better-sqlite3";
import { getChallenge } from "./challenges";
import type {
  Run,
  TraceEvent,
  Wallet,
  Receipt,
  Policy,
} from "./types";

type TraceEventType = "decision" | "tool_call" | "spend" | "artifact";

import { scoreRun } from "./scoring";

export class RunHarness {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  startRun(challengeId: string, contestantId: string, live: boolean): Run {
    const challenge = getChallenge(challengeId);
    if (!challenge) {
      throw new Error(`Challenge not found: ${challengeId}`);
    }

    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const wallet: Wallet = {
      start_cents: challenge.budget_cents,
      balance_cents: challenge.budget_cents,
      currency: challenge.currency,
    };

    this.db.prepare(
      `INSERT INTO runs (id, challenge_id, contestant_id, status, started_at, ended_at, wallet_start_cents, wallet_balance_cents, wallet_currency, live)
       VALUES (?, ?, ?, 'running', ?, NULL, ?, ?, ?, ?)`
    ).run(
      runId,
      challengeId,
      contestantId,
      startedAt,
      wallet.start_cents,
      wallet.balance_cents,
      wallet.currency,
      live ? 1 : 0
    );

    return {
      id: runId,
      challenge_id: challengeId,
      contestant_id: contestantId,
      status: "running",
      started_at: startedAt,
      ended_at: null,
      wallet,
      live,
    };
  }

  emitTrace(runId: string, type: TraceEventType, summary: string, data: TraceEvent["data"]): TraceEvent {
    const validTypes: TraceEventType[] = ["decision", "tool_call", "spend", "artifact"];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid trace event type: ${String(type)}`);
    }

    const row = this.db
      .prepare("SELECT MAX(seq) as maxSeq FROM trace_events WHERE run_id = ?")
      .get(runId) as { maxSeq: number | null };
    const seq = (row.maxSeq || 0) + 1;
    const ts = new Date().toISOString();

    this.db.prepare(
      `INSERT INTO trace_events (run_id, seq, ts, type, summary, data)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(runId, seq, ts, type, summary, JSON.stringify(data));

    return { run_id: runId, seq, ts, type, summary, data };
  }

  endRun(runId: string, status: "complete" | "failed"): void {
    const endedAt = new Date().toISOString();
    this.db.prepare(`UPDATE runs SET status = ?, ended_at = ? WHERE id = ?`).run(status, endedAt, runId);
    scoreRun(runId);
  }

  getRun(runId: string): Run | null {
    const row = this.db.prepare("SELECT * FROM runs WHERE id = ?").get(runId) as any;
    if (!row) return null;

    const wallet: Wallet = {
      start_cents: row.wallet_start_cents,
      balance_cents: row.wallet_balance_cents,
      currency: row.wallet_currency,
    };

    return {
      id: row.id,
      challenge_id: row.challenge_id,
      contestant_id: row.contestant_id,
      status: row.status as Run["status"],
      started_at: row.started_at,
      ended_at: row.ended_at,
      wallet,
      live: !!row.live,
    };
  }

  getTrace(runId: string): TraceEvent[] {
    const rows = this.db
      .prepare("SELECT * FROM trace_events WHERE run_id = ? ORDER BY seq")
      .all(runId) as any[];

    return rows.map((row) => ({
      run_id: row.run_id,
      seq: row.seq,
      ts: row.ts,
      type: row.type as TraceEventType,
      summary: row.summary,
      data: JSON.parse(row.data),
    }));
  }

  getReceipts(runId: string): Receipt[] {
    const rows = this.db
      .prepare("SELECT * FROM receipts WHERE run_id = ? ORDER BY ts")
      .all(runId) as any[];

    return rows.map((row) => ({
      run_id: row.run_id,
      ts: row.ts,
      kind: row.kind as Receipt["kind"],
      amount_cents: row.amount_cents,
      currency: row.currency,
      purpose: row.purpose,
      stripe_ref: row.stripe_ref,
      balance_after_cents: row.balance_after_cents,
    }));
  }

  enforceLimits(runId: string): void {
    const run = this.getRun(runId);
    if (!run || run.status !== "running") {
      return;
    }

    const challenge = getChallenge(run.challenge_id);
    if (!challenge) {
      return;
    }

    const now = new Date().getTime();
    const started = new Date(run.started_at).getTime();
    const elapsed = now - started;

    if (elapsed > challenge.time_limit_seconds * 1000) {
      this.endRun(runId, "failed");
      return;
    }

    if (run.wallet.balance_cents <= 0) {
      this.endRun(runId, "failed");
    }
  }

  replayRun(
    runId: string,
    callbacks: {
      onTrace: (event: TraceEvent) => void;
      onReceipt: (receipt: Receipt) => void;
      onDone: () => void;
    },
    speed: number = 0
  ): void {
    const traces = this.getTrace(runId);
    const receipts = this.getReceipts(runId);
    let traceIndex = 0;
    let receiptIndex = 0;

    let traceTimer: ReturnType<typeof setTimeout> | null = null;
    let receiptTimer: ReturnType<typeof setTimeout> | null = null;

    const nextTrace = () => {
      if (traceIndex < traces.length) {
        const event = traces[traceIndex];
        callbacks.onTrace(event);
        traceIndex++;
        const delay = speed > 0 ? speed : 0;
        traceTimer = setTimeout(nextTrace, delay);
      } else if (receiptIndex < receipts.length) {
        const receipt = receipts[receiptIndex];
        callbacks.onReceipt(receipt);
        receiptIndex++;
        receiptTimer = setTimeout(nextTrace, speed);
      } else {
        callbacks.onDone();
      }
    };

    nextTrace();
  }
}
