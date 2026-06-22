import fs from "node:fs";
import path from "node:path";
import { RunHarness } from "../src/lib/harness";
import { type TraceEvent, type Receipt, type ScoreResult } from "../src/lib/types";

function main() {
  const contestant = process.argv[2];
  const seed = process.argv[3];
  if (!contestant || !seed) {
    console.error("Usage: npx tsx scripts/bronze-replay.ts <contestant> <seed>");
    process.exit(1);
  }

  const base = path.join(process.cwd(), "demo");
  const candidate = path.join(base, `seed-${contestant}-${seed}.json`);
  if (!fs.existsSync(candidate)) {
    console.error(`Fixture not found: ${candidate}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(candidate, "utf-8");
  const parsed = JSON.parse(raw) as { traceEvents: TraceEvent[]; receipts: Receipt[]; scoreResult: ScoreResult };

  RunHarness.replaySaved(
    parsed.traceEvents,
    parsed.receipts,
    {
      onTrace: (e) => console.log(JSON.stringify(e)),
      onReceipt: (r) => console.log(JSON.stringify({ kind: "receipt", data: r })),
      onDone: () => console.log(JSON.stringify({ kind: "done", scoreResult: parsed.scoreResult })),
    },
    0
  );
}

main();
