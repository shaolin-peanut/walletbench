import { Contestant, Run, Receipt, TraceEvent } from "./types";

// Mock fixtures for S3 — replace with generated data from build brief §10
export const mockContestants: Contestant[] = [
  { id: "c-001", name: "Alpha", strategy: "aggressive" },
  { id: "c-002", name: "Beta", strategy: "conservative" },
  { id: "c-003", name: "Gamma", strategy: "balanced" },
];

export const mockRuns: Run[] = [
  {
    id: "r-001",
    contestantId: "c-001",
    challengeId: "fund-yourself",
    status: "completed",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
];

export const mockReceipts: Receipt[] = [
  {
    id: "rcpt-001",
    runId: "r-001",
    type: "charge",
    amountCents: 2500,
    purpose: "Initial budget",
    createdAt: new Date().toISOString(),
  },
];

export const mockTraceEvents: TraceEvent[] = [
  {
    id: "evt-001",
    runId: "r-001",
    eventType: "challenge.started",
    payload: { budget: 2500 },
    timestamp: new Date().toISOString(),
  },
];
