import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  ChallengeSchema,
  RunSchema,
  TraceEventSchema,
  ReceiptSchema,
  ScoreResultSchema,
} from "../src/lib/types";
import { loadSimulatedRun, listSimulatedRuns } from "../src/lib/simulated";

let passed = 0;
let failed = 0;

function check(name: string, result: z.SafeParseReturnType<unknown, unknown>) {
  if (result.success) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.error(`✗ ${name}`, result.error.issues.map((i) => i.message));
    failed++;
  }
}

const runs = listSimulatedRuns();

console.log(`Found ${runs.length} simulated runs`);

for (const entry of runs) {
  const sim = loadSimulatedRun(entry.challengeId, entry.runIndex);
  if (!sim) {
    console.error(`✗ ${entry.challengeId}-run-${entry.runIndex} missing`);
    failed++;
    continue;
  }
  check(`Run ${sim.run.id}`, RunSchema.safeParse(sim.run));
  sim.traceEvents.forEach((t) => check(`TraceEvent ${sim.run.id}#${t.seq}`, TraceEventSchema.safeParse(t)));
  sim.receipts.forEach((r) => check(`Receipt ${sim.run.id}@${r.ts}`, ReceiptSchema.safeParse(r)));
  check(`ScoreResult ${sim.run.id}`, ScoreResultSchema.safeParse(sim.scoreResult));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
