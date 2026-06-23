"use client";

import Link from "next/link";
import { useMemo } from "react";
import { fixtures } from "@/lib/fixtures";
import type { ScoreResult } from "@/lib/types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function taskSuccessToNumber(value: string): number {
  if (value === "pass") return 1;
  if (value === "partial") return 0.5;
  return 0;
}

function MetricBar({
  label,
  value,
  max = 1,
  color,
  allowOverflow = false,
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
  allowOverflow?: boolean;
}) {
  const pct = allowOverflow
    ? Math.max(0, (value / max) * 100)
    : Math.min(100, Math.max(0, (value / max) * 100));
  const visualPct = Math.min(125, pct);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-300">
        <span className="capitalize">{label}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-800 overflow-visible">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${visualPct}%` }}
        />
      </div>
    </div>
  );
}

export function LeaderboardCards({ data }: { data: ScoreResult[] }) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => a.rank - b.rank),
    [data]
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sorted.map((row) => {
        const contestant = fixtures.contestants.find(
          (c) => c.id === row.contestant_id
        );
        const name = contestant?.name ?? row.contestant_id;
        const initials = getInitials(name);

        return (
          <Link
            key={row.run_id}
            href={`/runs/${row.run_id}`}
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-lg transition hover:border-gray-600 hover:shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                {initials}
              </span>
              <div>
                <div className="font-semibold text-gray-100">{name}</div>
                <div className="text-xs text-gray-400">Rank #{row.rank}</div>
              </div>
            </div>

            <div className="space-y-3">
              <MetricBar
                label="efficiency"
                value={row.dimensions.roi}
                max={1}
                color="bg-emerald-400"
                allowOverflow
              />
              <MetricBar
                label="fit"
                value={taskSuccessToNumber(row.dimensions.task_success)}
                color="bg-sky-400"
              />
              <MetricBar
                label="compliance"
                value={row.dimensions.auditability}
                color="bg-violet-400"
              />
            </div>

            <div className="mt-4 text-right text-2xl font-bold text-white">
              {(row.total * 100).toFixed(0)}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
