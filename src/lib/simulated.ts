import fs from "node:fs";
import path from "node:path";
import { type Run, type TraceEvent, type Receipt, type ScoreResult } from "./types";

const simulatedDir = path.join(process.cwd(), "src/data/simulated");

export type SimulatedRun = {
  run: Run;
  traceEvents: TraceEvent[];
  receipts: Receipt[];
  scoreResult: ScoreResult;
};

export function loadSimulatedRun(challengeId: string, runIndex: number): SimulatedRun | null {
  const filePath = path.join(simulatedDir, `${challengeId}-run-${runIndex}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  return {
    run: parsed.run,
    traceEvents: parsed.traceEvents,
    receipts: parsed.receipts,
    scoreResult: parsed.scoreResult,
  };
}

export function listSimulatedRuns(challengeId?: string): Array<{ challengeId: string; runIndex: number }> {
  const files = fs.readdirSync(simulatedDir);
  const entries: Array<{ challengeId: string; runIndex: number }> = [];
  for (const file of files) {
    const match = file.match(/^(.+)-run-(\d+)\.json$/);
    if (!match) continue;
    const [, cid, idx] = match;
    if (challengeId && cid !== challengeId) continue;
    entries.push({ challengeId: cid, runIndex: Number.parseInt(idx, 10) });
  }
  entries.sort((a, b) => a.challengeId.localeCompare(b.challengeId) || a.runIndex - b.runIndex);
  return entries;
}
