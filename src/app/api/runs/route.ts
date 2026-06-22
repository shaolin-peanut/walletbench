import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getRuns } from "@/lib/db-queries";
import { RunHarness } from "@/lib/harness";

const PostBodySchema = z.object({
  challenge_id: z.string(),
  contestant_id: z.string(),
  live: z.boolean().optional(),
});

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get("challenge_id") ?? undefined;
  const runs = getRuns(db, challengeId);
  return NextResponse.json(runs);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const db = getDb();
  const harness = new RunHarness(db);

  try {
    const run = harness.startRun(parsed.data.challenge_id, parsed.data.contestant_id, parsed.data.live ?? false);
    return NextResponse.json(run, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to start run" }, { status: 500 });
  }
}
