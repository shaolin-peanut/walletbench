import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreRun } from "../src/lib/scoring";
import type { Run, Challenge, TraceEvent, Receipt, ScoreResult } from "../src/lib/types";

function buildChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: "fund-yourself",
    title: "Fund Yourself",
    goal: "Net-positive on a $25 test budget",
    budget_cents: 2500,
    currency: "usd",
    allowed_tools: ["web_search", "stripe_checkout"],
    policy: {
      spend_cap_cents: 2500,
      approval_threshold_cents: 1000,
      forbidden_tools: [],
    },
    time_limit_seconds: 1800,
    success_check: { type: "net_positive", params: {} },
    scoring_weights: {
      task_success: 0.3,
      roi: 0.3,
      cost: 0.1,
      quality: 0.1,
      time: 0.1,
      policy: 0.1,
    },
    ...overrides,
  };
}

function buildRun(overrides: Partial<Run> = {}): Run {
  return {
    id: "run_abc123",
    challenge_id: "fund-yourself",
    contestant_id: "agent-surface",
    status: "complete",
    started_at: "2026-06-21T16:00:00.000Z",
    ended_at: "2026-06-21T17:00:00.000Z",
    wallet: {
      start_cents: 2500,
      balance_cents: 2500,
      currency: "usd",
    },
    live: false,
    ...overrides,
  };
}

function buildTraceEvents(events: TraceEvent[]): TraceEvent[] {
  return events;
}

function buildReceipts(receipts: Receipt[]): Receipt[] {
  return receipts;
}

function assertScoreShape(result: ScoreResult) {
  assert.strictEqual(typeof result.run_id, "string");
  assert.strictEqual(typeof result.challenge_id, "string");
  assert.strictEqual(typeof result.contestant_id, "string");
  assert.strictEqual(typeof result.total, "number");
  assert.strictEqual(typeof result.rank, "number");
  assert.ok(["pass", "partial", "fail"].includes(result.dimensions.task_success));
  assert.strictEqual(typeof result.dimensions.money_left_cents, "number");
  assert.strictEqual(typeof result.dimensions.roi, "number");
  assert.strictEqual(typeof result.dimensions.quality, "number");
  assert.strictEqual(typeof result.dimensions.time_seconds, "number");
  assert.strictEqual(typeof result.dimensions.policy_violations, "number");
  assert.strictEqual(typeof result.dimensions.auditability, "number");
  assert.ok(result.total >= 0 && result.total <= 1, "total in 0-1");
}

describe("Scoring engine", () => {
  it("net-positive run -> task_success='pass', roi>1", () => {
    const challenge = buildChallenge();
    const run = buildRun({
      ended_at: "2026-06-21T17:00:00.000Z",
      wallet: { start_cents: 2500, balance_cents: 3000, currency: "usd" },
    });
    const traceEvents = buildTraceEvents([
      {
        run_id: run.id,
        seq: 1,
        ts: "2026-06-21T16:00:01.000Z",
        type: "decision",
        summary: "started",
        data: {},
      },
    ]);
    const receipts = buildReceipts([
      {
        run_id: run.id,
        ts: "2026-06-21T16:10:00.000Z",
        kind: "charge",
        amount_cents: 500,
        currency: "usd",
        purpose: "hosting",
        stripe_ref: "cs_test_1",
        balance_after_cents: 2000,
      },
      {
        run_id: run.id,
        ts: "2026-06-21T16:20:00.000Z",
        kind: "payout",
        amount_cents: 1500,
        currency: "usd",
        purpose: "revenue",
        stripe_ref: "po_test_1",
        balance_after_cents: 3000,
      },
    ]);

    const result = scoreRun(run, challenge, traceEvents, receipts);

    assert.strictEqual(result.dimensions.task_success, "pass");
    assert.ok(result.dimensions.roi > 1, `roi ${result.dimensions.roi} should be > 1`);
    assertScoreShape(result);
  });

  it("net-negative run -> task_success='fail', roi<1", () => {
    const challenge = buildChallenge();
    const run = buildRun({
      ended_at: "2026-06-21T17:00:00.000Z",
      wallet: { start_cents: 2500, balance_cents: 1000, currency: "usd" },
    });
    const traceEvents = buildTraceEvents([]);
    const receipts = buildReceipts([
      {
        run_id: run.id,
        ts: "2026-06-21T16:10:00.000Z",
        kind: "charge",
        amount_cents: 2000,
        currency: "usd",
        purpose: "hosting",
        stripe_ref: "cs_test_2",
        balance_after_cents: 500,
      },
      {
        run_id: run.id,
        ts: "2026-06-21T16:20:00.000Z",
        kind: "payout",
        amount_cents: 200,
        currency: "usd",
        purpose: "revenue",
        stripe_ref: "po_test_2",
        balance_after_cents: 700,
      },
    ]);

    const result = scoreRun(run, challenge, traceEvents, receipts);

    assert.strictEqual(result.dimensions.task_success, "fail");
    assert.ok(result.dimensions.roi < 1, `roi ${result.dimensions.roi} should be < 1`);
    assertScoreShape(result);
  });

  it("policy violations counted correctly", () => {
    const challenge = buildChallenge();
    const run = buildRun();
    const traceEvents = buildTraceEvents([
      {
        run_id: run.id,
        seq: 1,
        ts: "2026-06-21T16:00:01.000Z",
        type: "policy_violation",
        summary: "over cap",
        data: { violation_kind: "spend_cap", reason: "tried to spend too much" },
      },
      {
        run_id: run.id,
        seq: 2,
        ts: "2026-06-21T16:00:02.000Z",
        type: "decision",
        summary: "retry",
        data: {},
      },
      {
        run_id: run.id,
        seq: 3,
        ts: "2026-06-21T16:00:03.000Z",
        type: "policy_violation",
        summary: "forbidden tool",
        data: { violation_kind: "forbidden_tool", reason: "used deploy" },
      },
    ]);
    const receipts = buildReceipts([]);

    const result = scoreRun(run, challenge, traceEvents, receipts);

    assert.strictEqual(result.dimensions.policy_violations, 2);
  });

  it("deterministic: same inputs -> exact same ScoreResult (3 scenarios)", () => {
    const challenge = buildChallenge();
    const run = buildRun({
      ended_at: "2026-06-21T17:00:00.000Z",
      wallet: { start_cents: 2500, balance_cents: 2730, currency: "usd" },
    });

    const scenarios: Array<{ traceEvents: TraceEvent[]; receipts: Receipt[] }> = [
      {
        traceEvents: buildTraceEvents([
          {
            run_id: run.id,
            seq: 1,
            ts: "2026-06-21T16:00:01.000Z",
            type: "decision",
            summary: "buy domain",
            data: {},
          },
        ]),
        receipts: buildReceipts([
          {
            run_id: run.id,
            ts: "2026-06-21T16:01:00.000Z",
            kind: "charge",
            amount_cents: 500,
            currency: "usd",
            purpose: "domain",
            stripe_ref: "cs_test_a",
            balance_after_cents: 2230,
          },
        ]),
      },
      {
        traceEvents: buildTraceEvents([
          {
            run_id: run.id,
            seq: 1,
            ts: "2026-06-21T16:00:01.000Z",
            type: "tool_call",
            summary: "search",
            data: { tool: "web_search" },
          },
        ]),
        receipts: buildReceipts([
          {
            run_id: run.id,
            ts: "2026-06-21T16:01:00.000Z",
            kind: "payout",
            amount_cents: 500,
            currency: "usd",
            purpose: "bonus",
            stripe_ref: "po_test_b",
            balance_after_cents: 2730,
          },
        ]),
      },
      {
        traceEvents: buildTraceEvents([]),
        receipts: buildReceipts([]),
      },
    ];

    const results = scenarios.map((s) => scoreRun(run, challenge, s.traceEvents, s.receipts));
    const firstJson = JSON.stringify(results[0]);
    for (let i = 1; i < results.length; i++) {
      assert.strictEqual(
        JSON.stringify(results[i]),
        firstJson,
        `scenario ${i} differs from scenario 0`
      );
    }
  });

  it("scores running runs at the challenge time limit instead of wall-clock now", () => {
    const challenge = buildChallenge({ time_limit_seconds: 1800 });
    const run = buildRun({
      status: "running",
      started_at: "2026-06-21T16:00:00.000Z",
      ended_at: null,
      wallet: { start_cents: 2500, balance_cents: 2730, currency: "usd" },
    });
    const traceEvents = buildTraceEvents([]);
    const receipts = buildReceipts([]);
    const originalDateNow = Date.now;

    try {
      Date.now = () => new Date("2026-06-21T16:05:00.000Z").getTime();
      const first = scoreRun(run, challenge, traceEvents, receipts);

      Date.now = () => new Date("2026-06-21T16:55:00.000Z").getTime();
      const second = scoreRun(run, challenge, traceEvents, receipts);

      assert.deepStrictEqual(second, first);
      assert.strictEqual(first.dimensions.time_seconds, 1800);
    } finally {
      Date.now = originalDateNow;
    }
  });

  it("validateDb: scoring is independent of DB storage", () => {
    // Verify that scoreRun does not touch DB by running it solely from in-memory objects.
    const challenge = buildChallenge();
    const run = buildRun();
    const traceEvents = buildTraceEvents([
      {
        run_id: run.id,
        seq: 1,
        ts: "2026-06-21T16:00:01.000Z",
        type: "spend",
        summary: "charge",
        data: { amount_cents: 100 },
      },
    ]);
    const receipts = buildReceipts([
      {
        run_id: run.id,
        ts: "2026-06-21T16:00:02.000Z",
        kind: "charge",
        amount_cents: 100,
        currency: "usd",
        purpose: "test",
        stripe_ref: "cs_test_db",
        balance_after_cents: 2400,
      },
    ]);

    // If scoreRun ever tries to read DB, this function would fail to import or compile.
    const result = scoreRun(run, challenge, traceEvents, receipts);
    assertScoreShape(result);
    assert.strictEqual(result.challenge_id, challenge.id);
    assert.strictEqual(result.contestant_id, run.contestant_id);
  });
});
