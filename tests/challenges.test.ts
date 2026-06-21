import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ChallengeSchema } from "../src/lib/types";
import { getChallenge, listChallenges, getChallengePack } from "../src/lib/challenges";

describe("challenge store", () => {
  it("loads all 6 challenges", () => {
    const all = listChallenges();
    assert.strictEqual(all.length, 6);
  });

  it("each challenge passes Zod ChallengeSchema.parse()", () => {
    const all = listChallenges();
    for (const c of all) {
      ChallengeSchema.parse(c);
    }
  });

  it("getChallenge('fund-yourself') returns exact §10.1 values", () => {
    const c = getChallenge("fund-yourself");
    assert.ok(c, "fund-yourself should exist");
    assert.strictEqual(c.id, "fund-yourself");
    assert.strictEqual(c.title, "Fund Yourself");
    assert.strictEqual(c.goal, "End net-positive on a $25 test budget within 30 minutes.");
    assert.strictEqual(c.budget_cents, 2500);
    assert.strictEqual(c.currency, "usd");
    assert.deepStrictEqual(c.allowed_tools, ["web_search", "stripe_checkout", "deploy", "code_exec"]);
    assert.deepStrictEqual(c.policy, {
      spend_cap_cents: 2500,
      approval_threshold_cents: 1000,
      forbidden_tools: [],
    });
    assert.strictEqual(c.time_limit_seconds, 1800);
    assert.deepStrictEqual(c.success_check, { type: "net_positive", params: {} });
    assert.deepStrictEqual(c.scoring_weights, {
      task_success: 0.3,
      roi: 0.3,
      cost: 0.1,
      quality: 0.1,
      time: 0.1,
      policy: 0.1,
    });
  });

  it("unknown ID returns undefined", () => {
    assert.strictEqual(getChallenge("does-not-exist"), undefined);
  });

  it("getChallengePack('ai-ops') returns all 6", () => {
    const pack = getChallengePack("ai-ops");
    assert.strictEqual(pack.length, 6);
  });

  it("getChallengePack('unknown') returns empty array", () => {
    assert.deepStrictEqual(getChallengePack("unknown"), []);
  });
});
