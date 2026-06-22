import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluatePolicy } from "@/lib/policy";
import type { Action } from "@/lib/policy";
import type { Policy } from "@/lib/types";

const PolicyCheckSchema = z.object({
  policy: z.object({
    spend_cap_cents: z.number(),
    approval_threshold_cents: z.number(),
    allowed_tools: z.array(z.string()).optional(),
    forbidden_tools: z.array(z.string()),
  }),
  current_spend_cents: z.number(),
  action: z.object({
    kind: z.string(),
    amount_cents: z.number(),
    tool: z.string().optional(),
  }),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PolicyCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const { policy, current_spend_cents, action } = parsed.data;
  const decision = evaluatePolicy(policy as Policy, current_spend_cents, action as Action);
  return NextResponse.json(decision);
}
