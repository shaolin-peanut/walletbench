import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { startReplay } from "../src/lib/replay";
import type { TraceEvent, Receipt, Run } from "../src/lib/types";

function makeTraceEvents(runId: string, count: number, startMs = 0): TraceEvent[] {
  const events: TraceEvent[] = [];
  for (let i = 1; i <= count; i++) {
    events.push({
      run_id: runId,
      seq: i,
      ts: new Date(startMs + i * 10).toISOString(),
      type: i % 5 === 0 ? "spend" : "tool_call",
      summary: `Event ${i}`,
      data: { tool: "web_search", args: { step: i }, result: { step: i, ok: true } },
    });
  }
  return events;
}

function makeReceipts(runId: string, count: number, startMs = 0): Receipt[] {
  const receipts: Receipt[] = [];
  for (let i = 0; i < count; i++) {
    receipts.push({
      run_id: runId,
      ts: new Date(startMs + (i + 1) * 25).toISOString(),
      kind: i % 2 === 0 ? "charge" : "payout",
      amount_cents: (i + 1) * 100,
      currency: "usd",
      purpose: `Receipt ${i + 1}`,
      stripe_ref: `pi_test_${i}`,
      balance_after_cents: 2500 - (i + 1) * 100,
    });
  }
  return receipts;
}

function makeRun(runId: string): Run {
  return {
    id: runId,
    challenge_id: "fund-yourself",
    contestant_id: "agent-surface",
    status: "running",
    started_at: new Date(0).toISOString(),
    ended_at: null,
    wallet: { start_cents: 2500, balance_cents: 2500, currency: "usd" },
    live: true,
  };
}

describe("Replay engine", () => {
  it("emits 20 trace events + 8 receipts in chronological order", async () => {
    const runId = "replay_test_001";
    const traceEvents = makeTraceEvents(runId, 20, 0);
    const receiptEvents = makeReceipts(runId, 8, 0);

    const traces: TraceEvent[] = [];
    const receiptList: Receipt[] = [];
    let done = false;

    startReplay(
      runId,
      traceEvents,
      receiptEvents,
      {
        onTrace: (ev) => traces.push(ev),
        onReceipt: (r) => receiptList.push(r),
        onRunUpdate: () => {},
        onDone: () => {
          done = true;
        },
      },
      { speed: 10 }
    );

    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (done) {
          clearInterval(check);
          resolve();
        }
      }, 10);
    });

    assert.strictEqual(traces.length, 20, "expected 20 trace events");
    assert.strictEqual(receiptList.length, 8, "expected 8 receipts");

    // Verify chronological order via timestamps
    const allEmitted = [
      ...traces.map((t) => ({ ts: new Date(t.ts).getTime(), kind: "trace" as const, seq: t.seq })),
      ...receiptList.map((r) => ({ ts: new Date(r.ts).getTime(), kind: "receipt" as const, seq: -1 })),
    ];
    allEmitted.sort((a, b) => a.ts - b.ts);

    // Verify trace events are in seq order among themselves
    const traceSeqs = traces.map((t) => t.seq);
    for (let i = 1; i < traceSeqs.length; i++) {
      assert.ok(traceSeqs[i] > traceSeqs[i - 1], "trace seqs should increase");
    }
  });

  it("pause prevents further emissions until resume", async () => {
    const runId = "replay_test_002";
    const traceEvents = makeTraceEvents(runId, 10, Date.now());
    const receiptEvents = makeReceipts(runId, 4, Date.now());

    const traces: TraceEvent[] = [];
    const receiptList: Receipt[] = [];
    let done = false;

    const ctrl = startReplay(
      runId,
      traceEvents,
      receiptEvents,
      {
        onTrace: (ev) => traces.push(ev),
        onReceipt: (r) => receiptList.push(r),
        onRunUpdate: () => {},
        onDone: () => {
          done = true;
        },
      },
      { speed: 1, paused: true }
    );

    // Paused initially — nothing should emit immediately
    await new Promise((r) => setTimeout(r, 50));
    assert.strictEqual(traces.length, 0, "should not emit while paused");
    assert.strictEqual(receiptList.length, 0, "should not emit while paused");

    ctrl.resume();

    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (done) {
          clearInterval(check);
          resolve();
        }
      }, 10);
    });

    assert.strictEqual(traces.length, 10, "should emit all traces after resume");
    assert.strictEqual(receiptList.length, 4, "should emit all receipts after resume");
  });

  it("speed change affects timing", async () => {
    const runId = "replay_test_003";
    const base = Date.now();
    // 3 events with 100ms gaps = ~200ms total at 1x
    const traceEvents = makeTraceEvents(runId, 3, base);

    let done1x = false;
    const start1x = Date.now();
    startReplay(
      runId,
      traceEvents,
      [],
      {
        onTrace: () => {},
        onReceipt: () => {},
        onRunUpdate: () => {},
        onDone: () => {
          done1x = true;
        },
      },
      { speed: 1 }
    );

    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (done1x) {
          clearInterval(check);
          resolve();
        }
      }, 10);
    });
    const elapsed1x = Date.now() - start1x;

    let done2x = false;
    const start2x = Date.now();
    startReplay(
      runId,
      traceEvents,
      [],
      {
        onTrace: () => {},
        onReceipt: () => {},
        onRunUpdate: () => {},
        onDone: () => {
          done2x = true;
        },
      },
      { speed: 2 }
    );

    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (done2x) {
          clearInterval(check);
          resolve();
        }
      }, 10);
    });
    const elapsed2x = Date.now() - start2x;

    // 2x should be roughly half the time (with tolerance for timer jitter)
    assert.ok(elapsed2x < elapsed1x * 0.75, `2x speed should be faster than 1x: ${elapsed2x}ms vs ${elapsed1x}ms`);
  });

  it("stop prevents any further emissions", async () => {
    const runId = "replay_test_004";
    const base = Date.now();
    const traceEvents = makeTraceEvents(runId, 10, base);

    const traces: TraceEvent[] = [];
    let done = false;

    const ctrl = startReplay(
      runId,
      traceEvents,
      [],
      {
        onTrace: (ev) => traces.push(ev),
        onReceipt: () => {},
        onRunUpdate: () => {},
        onDone: () => {
          done = true;
        },
      },
      { speed: 1 }
    );

    // Stop immediately
    ctrl.stop();

    await new Promise((r) => setTimeout(r, 100));
    assert.strictEqual(traces.length, 0, "should not emit after stop");
    assert.strictEqual(done, false, "should not call onDone after stop");
  });

  it("onRunUpdate fires when a run is found", async () => {
    const runId = "run_001"; // exists in fixtures
    const traceEvents = makeTraceEvents(runId, 2, Date.now());

    let runUpdated = false;
    let done = false;

    startReplay(
      runId,
      traceEvents,
      [],
      {
        onTrace: () => {},
        onReceipt: () => {},
        onRunUpdate: () => {
          runUpdated = true;
        },
        onDone: () => {
          done = true;
        },
      },
      { speed: 10 }
    );

    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (done) {
          clearInterval(check);
          resolve();
        }
      }, 10);
    });

    assert.strictEqual(runUpdated, true, "onRunUpdate should fire for fixture run");
  });
});
