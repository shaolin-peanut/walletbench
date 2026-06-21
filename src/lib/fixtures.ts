/**
 * Mock fixtures for every §10 schema — S3 will populate with real data.
 * These allow Surface (U1–U4) to build views before Engine is live.
 */
import { Contestant, Challenge, Run, TraceEvent, Receipt, LeaderboardEntry, ScoreBreakdown } from "./types";

export const fixtures = {
  contestants: [] as Contestant[],
  challenges: [] as Challenge[],
  runs: [] as Run[],
  traces: [] as TraceEvent[],
  receipts: [] as Receipt[],
  leaderboard: [] as LeaderboardEntry[],
  scores: [] as ScoreBreakdown[],
};

// S3: fill these arrays with realistic mock data
// Example:
// fixtures.contestants.push({ id: "c1", name: "Alpha" });
