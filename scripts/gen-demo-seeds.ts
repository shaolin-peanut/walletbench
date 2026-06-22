import fs from "node:fs";
import path from "node:path";
import { buildRun, type RunPlan } from "../src/lib/contestant-runner";

const base = path.join(process.cwd(), "demo");
fs.mkdirSync(base, { recursive: true });

const contestants = ["alpha", "beta", "gamma"];
const challengeId = "fund-yourself";
const seeds = [101, 202, 303];

let generated = 0;

for (let i = 0; i < contestants.length; i++) {
  const contestantId = contestants[i];
  const seed = seeds[i];
  const runId = `run_demo_${contestantId}_${seed}`;
  const plan: RunPlan = {
    contestantId,
    challengeId,
    seed,
    runId,
    startedAt: new Date(Date.now() - 600_000).toISOString(),
    durationSeconds: 300 + seed % 1200,
    outcome: "complete",
  };

  const { run, traceEvents, receipts, scoreResult } = buildRun(plan);
  const outFile = path.join(base, `seed-${contestantId}-${seed}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ run, traceEvents, receipts, scoreResult }, null, 2));
  console.log(`wrote ${outFile}`);
  generated++;
}

console.log(`Generated ${generated} demo seed fixtures`);
