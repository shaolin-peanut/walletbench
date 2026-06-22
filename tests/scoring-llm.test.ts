import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { scoreRun, judgeArtifactQuality } from "../src/lib/scoring";
import type { Run, Challenge, TraceEvent, Receipt } from "../src/lib/types";

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

describe("LLM-judge quality scoring", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.LLM_JUDGE_API_URL;

  after(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv === undefined) {
      delete process.env.LLM_JUDGE_API_URL;
    } else {
      process.env.LLM_JUDGE_API_URL = originalEnv;
    }
  });

  it("mock LLM returns 0.9 -> quality=0.9", async () => {
    process.env.LLM_JUDGE_API_URL = "http://localhost:9999/judge";
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ score: 0.9 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    const challenge = buildChallenge();
    const run = buildRun();
    const traceEvents: TraceEvent[] = [
      {
        run_id: run.id,
        seq: 1,
        ts: "2026-06-21T16:00:01.000Z",
        type: "artifact",
        summary: "landing page",
        data: { result: { url: "https://example.com" } },
      },
    ];
    const receipts: Receipt[] = [];

    const result = await scoreRun(run, challenge, traceEvents, receipts);
    assert.strictEqual(result.dimensions.quality, 0.9);
  });

  it("no LLM configured -> quality=0.5", async () => {
    delete process.env.LLM_JUDGE_API_URL;
    globalThis.fetch = originalFetch;

    const challenge = buildChallenge();
    const run = buildRun();
    const traceEvents: TraceEvent[] = [
      {
        run_id: run.id,
        seq: 1,
        ts: "2026-06-21T16:00:01.000Z",
        type: "artifact",
        summary: "landing page",
        data: { result: { url: "https://example.com" } },
      },
    ];
    const receipts: Receipt[] = [];

    const result = await scoreRun(run, challenge, traceEvents, receipts);
    assert.strictEqual(result.dimensions.quality, 0.5);
  });

  it("invalid LLM response -> quality=0.5 fallback", async () => {
    process.env.LLM_JUDGE_API_URL = "http://localhost:9999/judge";
    globalThis.fetch = async () =>
      new Response("this is not a score", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });

    const challenge = buildChallenge();
    const run = buildRun();
    const traceEvents: TraceEvent[] = [
      {
        run_id: run.id,
        seq: 1,
        ts: "2026-06-21T16:00:01.000Z",
        type: "artifact",
        summary: "landing page",
        data: { result: { url: "https://example.com" } },
      },
    ];
    const receipts: Receipt[] = [];

    const result = await scoreRun(run, challenge, traceEvents, receipts);
    assert.strictEqual(result.dimensions.quality, 0.5);
  });

  it("judgeArtifactQuality returns 0.5 when LLM API errors", async () => {
    process.env.LLM_JUDGE_API_URL = "http://localhost:9999/judge";
    globalThis.fetch = async () => {
      throw new Error("network failure");
    };

    const score = await judgeArtifactQuality({ url: "https://example.com" }, "test rubric");
    assert.strictEqual(score, 0.5);
  });

  it("judgeArtifactQuality parses score from OpenAI-style chat response", async () => {
    process.env.LLM_JUDGE_API_URL = "http://localhost:9999/judge";
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "0.75" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );

    const score = await judgeArtifactQuality({ url: "https://example.com" }, "test rubric");
    assert.strictEqual(score, 0.75);
  });

  it("judgeArtifactQuality clamps score to 0-1 range", async () => {
    process.env.LLM_JUDGE_API_URL = "http://localhost:9999/judge";
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ score: 1.5 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    const score = await judgeArtifactQuality({ url: "https://example.com" }, "test rubric");
    assert.strictEqual(score, 1.0);
  });
});
