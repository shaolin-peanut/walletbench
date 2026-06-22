import fs from "node:fs";
import path from "node:path";
import { createRng } from "../src/lib/seedable-rng";
import { getChallenge } from "../src/lib/challenges";
import { type ScoreResult } from "../src/lib/types";
import { buildRun, type RunPlan } from "../src/lib/contestant-runner";
import { RunHarness } from "../src/lib/harness";

function parseArgs() {
  const args = process.argv.slice(2);
  const flags: Record<string, string | boolean | number> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--seed") flags.seed = Number.parseInt(args[++i], 10);
    else if (args[i] === "--contestant") flags.contestant = args[++i];
    else if (args[i] === "--challenge") flags.challenge = args[++i];
    else if (args[i] === "--output-dir") flags.outputDir = args[++i];
    else if (args[i] === "--demo-stream") flags.demoStream = true;
  }
  return flags;
}

function main() {
  const flags = parseArgs();
  const contestantId = String(flags.contestant || "wb-contestant");
  const challengeId = String(flags.challenge || "fund-yourself");
  const challenge = getChallenge(challengeId);
  if (!challenge) {
    console.error(`Challenge not found: ${challengeId}`);
    process.exit(1);
  }

  let seed = Number.isFinite(Number(flags.seed)) ? Number(flags.seed) : Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  if (!Number.isFinite(seed)) seed = Date.now();

  console.error(`Seeded run: seed=${seed} contestant=${contestantId} challenge=${challengeId}`);

  const rng = createRng(seed);
  const runId = `run_${challengeId}_${contestantId}_${seed}`;
  const startedAt = new Date(seed * 1000).toISOString();
  const durationSeconds = 300 + rng.int(0, 1800);
  const outcome: RunPlan["outcome"] = rng.next() < 0.6 ? "complete" : "failed";

  const plan: RunPlan = { contestantId, challengeId, seed, runId, startedAt, durationSeconds, outcome };
  const { run, traceEvents, receipts, scoreResult } = buildRun(plan);

  const outputDir = String(flags.outputDir || path.join(process.cwd(), "demo"));
  fs.mkdirSync(outputDir, { recursive: true });
  const outFile = path.join(outputDir, `seed-${contestantId}-${seed}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ run, traceEvents, receipts, scoreResult }, null, 2));
  console.error(`Wrote fixture: ${outFile}`);

  if (flags.demoStream) {
    RunHarness.replaySaved(
      traceEvents,
      receipts,
      {
        onTrace: (e) => console.log(JSON.stringify(e)),
        onReceipt: (r) => console.log(JSON.stringify({ kind: "receipt", data: r })),
        onDone: () => console.log(JSON.stringify({ kind: "done", runId, scoreResult })),
      },
      0
    );
  } else {
    console.log(JSON.stringify({ runId, seed, status: run.status, balance_cents: run.wallet.balance_cents, total: scoreResult.total }));
  }
}

main();
