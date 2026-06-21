import { z } from "zod";
import {
  ChallengeSchema,
  ContestantSchema,
  RunSchema,
  TraceEventSchema,
  ReceiptSchema,
  ScoreResultSchema,
  PolicyDecisionSchema,
  type Run,
} from "../src/lib/types";
import {
  challenges,
  contestants,
  runs,
  traceEvents,
  receipts,
  scoreResults,
  policyDecision,
  fixtures,
} from "../src/lib/fixtures";

let passed = 0;
let failed = 0;

function check(name: string, result: z.SafeParseReturnType<unknown, unknown>) {
  if (result.success) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.error(`✗ ${name}`, result.error.issues);
    failed++;
  }
}

// --- Validate individual collections ---

console.log("=== Challenges ===");
for (const c of challenges) {
  check(`Challenge ${c.id}`, ChallengeSchema.safeParse(c));
}

console.log("\n=== Contestants ===");
for (const c of contestants) {
  check(`Contestant ${c.id}`, ContestantSchema.safeParse(c));
}

console.log("\n=== Runs ===");
for (const r of runs) {
  check(`Run ${r.id}`, RunSchema.safeParse(r));
}

console.log("\n=== TraceEvents ===");
for (const t of traceEvents) {
  check(`TraceEvent ${t.run_id}#${t.seq}`, TraceEventSchema.safeParse(t));
}

console.log("\n=== Receipts ===");
for (const r of receipts) {
  check(`Receipt ${r.run_id}@${r.ts}`, ReceiptSchema.safeParse(r));
}

console.log("\n=== ScoreResults ===");
for (const s of scoreResults) {
  check(`ScoreResult ${s.run_id} (rank ${s.rank})`, ScoreResultSchema.safeParse(s));
}

console.log("\n=== PolicyDecision ===");
check("PolicyDecision", PolicyDecisionSchema.safeParse(policyDecision));

// --- Coherence checks ---

console.log("\n=== Coherence checks ===");

// Receipt running balance per run matches wallet start/balance
for (const run of runs) {
  const runReceipts = receipts
    .filter((r) => r.run_id === run.id)
    .sort((a, b) => a.ts.localeCompare(b.ts));

  let balance = run.wallet.start_cents;
  for (const receipt of runReceipts) {
    if (receipt.kind === "charge") {
      balance -= receipt.amount_cents;
    } else if (receipt.kind === "payout") {
      balance += receipt.amount_cents;
    } else if (receipt.kind === "refund") {
      balance -= receipt.amount_cents; // refund reduces balance
    }
    if (receipt.balance_after_cents !== balance) {
      console.error(
        `✗ Receipt balance mismatch on ${run.id} @ ${receipt.ts}: expected ${balance}, got ${receipt.balance_after_cents}`
      );
      failed++;
    } else {
      passed++;
    }
  }

  const expectedEnd = run.wallet.balance_cents;
  if (run.status === "complete" && balance !== expectedEnd) {
    console.error(
      `✗ Run ${run.id} wallet balance mismatch: expected ${expectedEnd}, got ${balance}`
    );
    failed++;
  } else {
    passed++;
  }
}

// TraceEvent seq per run is sequential starting from 1
for (const run of runs) {
  const runEvents = traceEvents
    .filter((t) => t.run_id === run.id)
    .sort((a, b) => a.seq - b.seq);
  const isEmpty = runEvents.length === 0;
  for (let i = 0; i < runEvents.length; i++) {
    if (runEvents[i].seq !== i + 1) {
      console.error(
        `✗ TraceEvent ${run.id} seq gap/out-of-order at index ${i}: expected ${i + 1}, got ${runEvents[i].seq}`
      );
      failed++;
    } else if (!isEmpty) {
      passed++;
    }
  }
}

// Accessor sanity
console.log("\n=== Accessor sanity ===");
for (const r of runs) {
  const byGet = fixtures.getRun(r.id);
  check(`getRun(${r.id})`, z.custom<Run>().safeParse(byGet!));
}
for (const r of runs) {
  const byArr = fixtures.runs.find((x) => x.id === r.id);
  check(`runs[] matches getRun(${r.id})`, z.custom<Run>().safeParse(byArr!));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
