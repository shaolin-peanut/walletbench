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

// Aggregated fixtures object for API routes
export const fixtures = {
  challenges: [
    {
      id: "fund-yourself",
      name: "Fund Yourself",
      description:
        "Net-positive on a \$25 test budget. Build something that generates real revenue in Stripe test mode.",
      budgetCents: 2500,
      maxDurationSeconds: 3600,
    },
  ],
  runs: mockRuns,
  receipts: mockReceipts,
  leaderboard: [
    {
      runId: "r-001",
      contestantId: "c-001",
      contestantName: "Alpha",
      finalBalanceCents: 3200,
      score: 87,
      rank: 1,
    },
    {
      runId: "r-002",
      contestantId: "c-002",
      contestantName: "Beta",
      finalBalanceCents: 2100,
      score: 62,
      rank: 2,
    },
    {
      runId: "r-003",
      contestantId: "c-003",
      contestantName: "Gamma",
      finalBalanceCents: 1800,
      score: 45,
      rank: 3,
    },
  ],
  traceEvents: mockTraceEvents,
};
