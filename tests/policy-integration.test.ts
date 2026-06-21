// tests/policy-integration.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluatePolicy } from "../src/lib/policy";
import type { Policy, PolicyDecision } from "../src/lib/types";

const ok = (decision: PolicyDecision) => {
  assert.strictEqual(typeof decision.allowed, "boolean");
  assert.strictEqual(typeof decision.reason, "string");
  assert.strictEqual(typeof decision.requires_approval, "boolean");
};

const policy = (overrides: Partial<Policy> = {}): Policy => ({
  spend_cap_cents: 1000,
  approval_threshold_cents: 500,
  forbidden_tools: ["stripe"],
  ...overrides,
});

describe("evaluatePolicy", () => {
  it("over-cap → reject 'exceeds spend cap'", () => {
    const d = evaluatePolicy(policy(), 800, {
      kind: "payment",
      amount_cents: 300,
      tool: "stripe",
    });
    ok(d);
    assert.strictEqual(d.allowed, false);
    assert.strictEqual(d.reason, "exceeds spend cap");
    assert.strictEqual(d.requires_approval, false);
  });

  it("forbidden tool → reject 'tool is forbidden'", () => {
    const d = evaluatePolicy(policy(), 0, {
      kind: "payment",
      amount_cents: 100,
      tool: "stripe",
    });
    ok(d);
    assert.strictEqual(d.allowed, false);
    assert.strictEqual(d.reason, "tool is forbidden");
    assert.strictEqual(d.requires_approval, false);
  });

  it("tool not in allowlist → reject 'tool not in allowed list'", () => {
    const d = evaluatePolicy(
      policy({ allowed_tools: ["search", "read"] }),
      0,
      {
        kind: "payment",
        amount_cents: 100,
        tool: "stripe",
      },
    );
    ok(d);
    assert.strictEqual(d.allowed, false);
    assert.strictEqual(d.reason, "tool not in allowed list");
    assert.strictEqual(d.requires_approval, false);
  });

  it("under threshold → pass, requires_approval=false", () => {
    const d = evaluatePolicy(policy(), 0, {
      kind: "payment",
      amount_cents: 400,
      tool: "search",
    });
    ok(d);
    assert.strictEqual(d.allowed, true);
    assert.strictEqual(d.reason, "within cap");
    assert.strictEqual(d.requires_approval, false);
  });

  it("at threshold → pass, requires_approval=true", () => {
    const d = evaluatePolicy(policy(), 0, {
      kind: "payment",
      amount_cents: 500,
      tool: "search",
    });
    ok(d);
    assert.strictEqual(d.allowed, true);
    assert.strictEqual(d.reason, "above approval threshold");
    assert.strictEqual(d.requires_approval, true);
  });

  it("exact-at-cap → reject 'exceeds spend cap'", () => {
    const d = evaluatePolicy(policy(), 800, {
      kind: "payment",
      amount_cents: 200,
      tool: "search",
    });
    ok(d);
    assert.strictEqual(d.allowed, false);
    assert.strictEqual(d.reason, "exceeds spend cap");
    assert.strictEqual(d.requires_approval, false);
  });
});
