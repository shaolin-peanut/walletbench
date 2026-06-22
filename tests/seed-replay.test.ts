import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../src/lib/seedable-rng";
import { buildRun, type RunPlan } from "../src/lib/contestant-runner";
import { RunHarness } from "../src/lib/harness";
import type { Run, TraceEvent, Receipt, ScoreResult } from "../src/lib/types";
import Database from "better-sqlite3";
import { initDb } from "../src/lib/schema";

function freshDb(): Database.Database {
  const path = `/tmp/walletbench-seed-test-${Date.now()}.db`;
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  initDb(db);
  return db;
}

describe("Deterministic seed and replay", () => {
  it("createRng(seed) is deterministic for same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const aVals = Array.from({ length: 20 }, () => a.next());
    const bVals = Array.from({ length: 20 }, () => b.next());
    assert.deepStrictEqual(aVals, bVals, "same seed produces same sequence");
  });

  it("different seeds produce different sequences", () => {
    const a = createRng(1);
    const b = createRng(2);
    const aVals = Array.from({ length: 20 }, () => a.next());
    const bVals = Array.from({ length: 20 }, () => b.next());
    assert.notDeepStrictEqual(aVals, bVals, "different seeds diverge");
  });

  it("buildRun with same seed produces identical trace/receipt/score payloads", () => {
    const plan: RunPlan = {
      contestantId: "wb-contestant-alpha",
      challengeId: "fund-yourself",
      seed: 7777,
      runId: "run_det_7777",
      startedAt: "2026-06-21T16:00:00.000Z",
      durationSeconds: 400,
      outcome: "complete",
    };

    const first = buildRun(plan);
    const second = buildRun(plan);

    assert.strictEqual(first.traceEvents.length, second.traceEvents.length, "same trace length");
    for (let i = 0; i < first.traceEvents.length; i++) {
      assert.deepStrictEqual(first.traceEvents[i], second.traceEvents[i], `traceEvent[${i}] matches`);
    }

    assert.strictEqual(first.receipts.length, second.receipts.length, "same receipts length");
    for (let i = 0; i < first.receipts.length; i++) {
      assert.deepStrictEqual(first.receipts[i], second.receipts[i], `receipt[${i}] matches`);
    }

    assert.deepStrictEqual(first.scoreResult, second.scoreResult, "scoreResult matches");
  });

  it("replaySaved emits all traces in order then receipts then done", async () => {
    const db = freshDb();
    const harness = new RunHarness(db);
    const run = harness.startRun("fund-yourself", "replay-bot", false);

    harness.emitTrace(run.id, "decision", "start", { product_pick: { product: "x" } });
    harness.emitTrace(run.id, "spend", "charge 100", { amount_cents: 100, budget_delta: { previous_cents: 1000, new_cents: 900, amount_cents: 100 } });
    harness.emitTrace(run.id, "artifact", "done", {});

    const order: string[] = [];

    await new Promise<void>((resolve) => {
      RunHarness.replaySaved(
        harness.getTrace(run.id),
        harness.getReceipts(run.id),
        {
          onTrace: (e) => {
            order.push(`trace:${e.seq}:${e.type}`);
          },
          onReceipt: (r) => {
            order.push(`receipt:${r.amount_cents}`);
          },
          onDone: () => {
            order.push("done");
            resolve();
          },
        },
        0
      );
    });

    assert.strictEqual(order.length, 4, "3 traces + done");
    assert.strictEqual(order[0], "trace:1:decision");
    assert.strictEqual(order[1], "trace:2:spend");
    assert.strictEqual(order[2], "trace:3:artifact");
    assert.strictEqual(order[3], "done");
  });

  it("trace events include product picks, budget deltas, and rubric inputs", () => {
    const plan: RunPlan = {
      contestantId: "wb-contestant-beta",
      challengeId: "fund-yourself",
      seed: 12345,
      runId: "run_meta_12345",
      startedAt: "2026-06-21T16:00:00.000Z",
      durationSeconds: 400,
      outcome: "complete",
    };

    const { traceEvents } = buildRun(plan);

    let hasProductPick = false;
    let hasBudgetDelta = false;
    let hasRubricInputs = false;

    for (const evt of traceEvents) {
      if (evt.data.product_pick) hasProductPick = true;
      if (evt.data.budget_delta) hasBudgetDelta = true;
      if (evt.data.rubric_inputs) {
        const r = evt.data.rubric_inputs as Record<string, number>;
        if (typeof r.efficiency === "number" && typeof r.fit === "number" && typeof r.compliance === "number") {
          hasRubricInputs = true;
        }
      }
    }

    assert.ok(hasProductPick, "at least one event includes product_pick");
    assert.ok(hasBudgetDelta, "at least one spend event includes budget_delta");
    assert.ok(hasRubricInputs, "events include rubric_inputs with efficiency/fit/compliance");
  });
});
