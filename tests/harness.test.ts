import { describe, it } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { initDb } from "../src/lib/schema";
import { getChallenge } from "../src/lib/challenges";
import { RunHarness } from "../src/lib/harness";
import type { Run, TraceEvent, Receipt } from "../src/lib/types";

function freshDb(): Database.Database {
  const path = `/tmp/walletbench-harness-test-${Date.now()}.db`;
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  initDb(db);
  return db;
}

describe("RunHarness", () => {
  it("startRun creates a valid Run in DB", () => {
    const db = freshDb();
    const harness = new RunHarness(db);

    const run = harness.startRun("fund-yourself", "engine-bot", false);

    assert.ok(run.id, "run id is set");
    assert.strictEqual(run.challenge_id, "fund-yourself");
    assert.strictEqual(run.contestant_id, "engine-bot");
    assert.strictEqual(run.status, "running");
    assert.ok(run.started_at, "started_at is set");
    assert.strictEqual(run.ended_at, null);
    assert.strictEqual(run.wallet.start_cents, 2500);
    assert.strictEqual(run.wallet.balance_cents, 2500);
    assert.strictEqual(run.wallet.currency, "usd");
    assert.strictEqual(run.live, false);

    const fromDb = harness.getRun(run.id);
    assert.ok(fromDb, "run exists in DB");
    assert.strictEqual(fromDb!.id, run.id);
  });

  it("emit 10 trace events -> correct seq order", () => {
    const db = freshDb();
    const harness = new RunHarness(db);
    const run = harness.startRun("fund-yourself", "engine-bot", false);

    for (let i = 1; i <= 10; i++) {
      const type: TraceEvent["type"] = "decision";
      const event = harness.emitTrace(run.id, type, `event ${i}`, { args: { index: i } });
      assert.strictEqual(event.seq, i, `event ${i} seq matches`);
    }

    const trace = harness.getTrace(run.id);
    assert.strictEqual(trace.length, 10, "10 events in trace");

    for (let i = 0; i < 10; i++) {
      assert.strictEqual(trace[i].seq, i + 1, `trace[${i}] seq`);
      assert.deepStrictEqual(trace[i].data, { args: { index: i + 1 } }, `trace[${i}] data`);
    }
  });

  it("budget exhaustion auto-ends run as failed", () => {
    const db = freshDb();
    const harness = new RunHarness(db);
    const run = harness.startRun("fund-yourself", "engine-bot", false);

    // Flip balance to zero to simulate budget exhaustion.
    db.prepare("UPDATE runs SET wallet_balance_cents = 0 WHERE id = ?").run(run.id);

    harness.enforceLimits(run.id);

    const updated = harness.getRun(run.id);
    assert.ok(updated, "run still exists");
    assert.strictEqual(updated!.status, "failed");
    assert.ok(updated!.ended_at, "ended_at is set on budget exhaustion");
  });

  it("replay emits events in order via callbacks", async () => {
    const db = freshDb();
    const harness = new RunHarness(db);
    const run = harness.startRun("fund-yourself", "engine-bot", false);

    harness.emitTrace(run.id, "tool_call", "search", { tool: "web_search", args: { query: "x" } });
    harness.emitTrace(run.id, "spend", "charge 100", { tool: "stripe_checkout", args: { amount_cents: 100 } });
    harness.emitTrace(run.id, "artifact", "delivered", { result: { url: "https://example" } });

    const order: { kind: string; summary: string }[] = [];

    await new Promise<void>((resolve) => {
      harness.replayRun(
        run.id,
        {
          onTrace: (event) => order.push({ kind: "trace", summary: event.summary }),
          onReceipt: (_receipt) => order.push({ kind: "receipt", summary: "receipt" }),
          onDone: () => {
            resolve();
          },
        },
        1 // speed in ms
      );
    });

    assert.strictEqual(order.length, 3, "3 replayed items");
    assert.strictEqual(order[0].summary, "search");
    assert.strictEqual(order[1].summary, "charge 100");
    assert.strictEqual(order[2].summary, "delivered");
  });
});
