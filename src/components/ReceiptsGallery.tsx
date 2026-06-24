"use client";

import { useMemo } from "react";
import { fixtures } from "@/lib/fixtures";
import type { Contestant, Receipt, ScoreResult } from "@/lib/types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function redFlag(value: number, threshold = 0.6) {
  return value < threshold;
}

function toNumeric(value: number | "pass" | "partial" | "fail"): number {
  if (typeof value === "number") return value;
  if (value === "pass") return 1;
  if (value === "partial") return 0.5;
  return 0;
}

function ReceiptCard({
  contestant,
  receipts,
  score,
}: {
  contestant: Contestant;
  receipts: Receipt[];
  score: ScoreResult | undefined;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
          {getInitials(contestant.name)}
        </span>
        <div>
          <div className="font-semibold text-gray-100">{contestant.name}</div>
          <div className="text-xs text-gray-400">{contestant.kind}</div>
        </div>
      </div>

      {score && (
        <div className="mb-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Score Breakdown
          </h3>
          {(
            [
              { label: "task_success", value: score.dimensions.task_success },
              { label: "roi", value: score.dimensions.roi },
              { label: "quality", value: score.dimensions.quality },
              { label: "time", value: 1 - Math.min(1, score.dimensions.time_seconds / 7200) },
              { label: "policy", value: Math.max(0, 1 - score.dimensions.policy_violations) },
              { label: "auditability", value: score.dimensions.auditability },
            ] as const
          ).map((entry) => {
            const raw = toNumeric(entry.value);
            const isFlagged = redFlag(raw);
            return (
              <div
                key={entry.label}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${
                  isFlagged
                    ? "border-red-500/60 bg-red-500/10 text-red-300"
                    : "border-gray-800 bg-gray-950 text-gray-300"
                }`}
              >
                <span className="capitalize">{entry.label.replace(/_/g, " ")}</span>
                <span className="font-mono font-semibold">{(raw * 100).toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      )}

      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
        Line Items
      </h3>
      <div className="space-y-2">
        {receipts.length === 0 && (
          <p className="text-xs text-gray-500">No receipts recorded.</p>
        )}
        {receipts.map((r) => (
          <div
            key={`${r.run_id}-${r.ts}-${r.stripe_ref}`}
            className="flex items-start justify-between rounded-md border border-gray-800 bg-gray-950 px-3 py-2"
          >
            <div>
              <p className="text-xs font-medium text-gray-200">{r.purpose}</p>
              <p className="text-[10px] text-gray-500">
                {new Date(r.ts).toLocaleString("en-US", { dateStyle: "short", timeStyle: "medium" })}
              </p>
              <p className="text-[10px] text-gray-600">{r.stripe_ref}</p>
            </div>
            <div className="text-right">
              <p
                className={`text-xs font-semibold ${
                  r.kind === "charge" ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {r.kind === "charge" ? "-" : "+"}
                {formatCents(r.amount_cents, r.currency)}
              </p>
              <p className="text-[10px] text-gray-500">
                bal: {formatCents(r.balance_after_cents, r.currency)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReceiptsGallery() {
  const grouped = useMemo(() => {
    const byContestant = new Map<string, { contestant: Contestant; receipts: Receipt[]; score?: ScoreResult }>();
    for (const c of fixtures.contestants) {
      byContestant.set(c.id, { contestant: c, receipts: [] });
    }
    for (const r of fixtures.receipts) {
      const run = fixtures.getRun(r.run_id);
      if (run) {
        const entry = byContestant.get(run.contestant_id);
        if (entry) {
          entry.receipts.push(r);
        }
      }
    }
    for (const s of fixtures.scoreResults) {
      const entry = byContestant.get(s.contestant_id);
      if (entry) {
        entry.score = s;
      }
    }
    return Array.from(byContestant.values());
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {grouped.map((entry) => (
        <ReceiptCard
          key={entry.contestant.id}
          contestant={entry.contestant}
          receipts={entry.receipts}
          score={entry.score}
        />
      ))}
    </div>
  );
}
