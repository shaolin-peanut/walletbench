export interface TraceContext {
  runId: string;
  seq: number;
  ts: string;
}

export interface RubricInputs {
  efficiency: number;
  fit: number;
  compliance: number;
}

export function makeEvent(
  ctx: TraceContext,
  type: "decision" | "tool_call" | "spend" | "artifact" | "policy_violation",
  summary: string,
  data: Record<string, unknown> = {}
) {
  return {
    run_id: ctx.runId,
    seq: ctx.seq,
    ts: ctx.ts,
    type,
    summary,
    data,
  };
}

export function decisionEvent(
  ctx: TraceContext,
  summary: string,
  extra: Record<string, unknown> = {}
) {
  return makeEvent(ctx, "decision", summary, { ...extra, rubric_inputs: { efficiency: 0, fit: 0, compliance: 0 } });
}

export function toolCallEvent(
  ctx: TraceContext,
  tool: string,
  args: Record<string, unknown> = {},
  summary?: string
) {
  return makeEvent(ctx, "tool_call", summary || `Run ${tool}`, {
    tool,
    args,
    result: {},
    rubric_inputs: { efficiency: 0, fit: 0, compliance: 0 },
  });
}

export function spendEvent(
  ctx: TraceContext,
  amountCents: number,
  previousBalanceCents: number,
  summary: string
) {
  const newBalance = previousBalanceCents - amountCents;
  return makeEvent(ctx, "spend", summary, {
    tool: "stripe_checkout",
    args: { amount_cents: amountCents },
    result: { approved: newBalance >= 0 },
    amount_cents: amountCents,
    budget_delta: {
      previous_cents: previousBalanceCents,
      new_cents: newBalance,
      amount_cents: amountCents,
    },
    rubric_inputs: { efficiency: 0, fit: 0, compliance: 0 },
  });
}

export function artifactEvent(
  ctx: TraceContext,
  summary: string,
  result: Record<string, unknown> = {}
) {
  return makeEvent(ctx, "artifact", summary, { result, rubric_inputs: { efficiency: 0, fit: 0, compliance: 0 } });
}
