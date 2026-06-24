"use client";

import { useMemo } from "react";
import Link from "next/link";
import { fixtures } from "@/lib/fixtures";
import type { ScoreResult } from "@/lib/types";
import { Sparkline } from "@/components/Sparkline";
import { Trophy, TrendingUp, Wallet, AlertTriangle, Clock } from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function colorForROI(roi: number): string {
  if (roi >= 1) return "text-emerald-400";
  if (roi >= 0.5) return "text-amber-400";
  return "text-red-400";
}

function bgForROI(roi: number): string {
  if (roi >= 1) return "bg-emerald-500/15 border-emerald-500/30";
  if (roi >= 0.5) return "bg-amber-500/15 border-amber-500/30";
  return "bg-red-500/15 border-red-500/30";
}

function generateSparkline(runId: string, target: number, count = 12): number[] {
  const points: number[] = [];
  let seed = 0;
  for (let i = 0; i < runId.length; i++) seed += runId.charCodeAt(i) * (i + 1);

  const start = Math.max(0, target * 0.35 + Math.sin(seed) * 0.2 * target);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const wobble =
      Math.sin(seed + i * 1.4) * 0.08 +
      Math.cos(seed + i * 0.9) * 0.06 +
      Math.sin(seed + i * 2.1) * 0.04;
    const v = start + (target - start) * t + wobble * target;
    points.push(Number(v.toFixed(2)));
  }
  points[points.length - 1] = target;
  return points;
}

function RankBadge({ rank }: { rank: 1 | 2 | 3 }) {
  const styles: Record<number, string> = {
    1: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_24px_rgba(255,215,0,0.25)]",
    2: "bg-gray-400/15 text-gray-200 border-gray-500/40",
    3: "bg-amber-700/15 text-amber-600 border-amber-700/40",
  };

  const icons: Record<number, string> = {
    1: "👑",
    2: "",
    3: "",
  };

  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${styles[rank]}`}
    >
      {icons[rank] ?? `#${rank}`}
    </span>
  );
}

function TopCard({
  rank,
  row,
}: {
  rank: 1 | 2 | 3;
  row: ScoreResult;
}) {
  const contestant = fixtures.contestants.find((c) => c.id === row.contestant_id);
  const name = contestant?.name ?? row.contestant_id;
  const initials = getInitials(name);
  const challenge = fixtures.challenges.find((c) => c.id === row.challenge_id);

  const roiSparkline = useMemo(
    () => generateSparkline(row.run_id, row.dimensions.roi),
    [row.run_id, row.dimensions.roi]
  );
  const scoreSparkline = useMemo(
    () => generateSparkline(`${row.run_id}-score`, row.total, 10),
    [row.run_id, row.total]
  );

  const roiColorClass = colorForROI(row.dimensions.roi);
  const roiBgClass = bgForROI(row.dimensions.roi);

  return (
    <Link
      href={`/runs/${row.run_id}`}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-150 hover:scale-[1.01] ${
        rank === 1
          ? "border-amber-500/40 bg-gray-900 shadow-[0_0_40px_rgba(255,215,0,0.10)]"
          : rank === 2
          ? "border-gray-700 bg-gray-900/80"
          : "border-gray-800 bg-gray-900/80"
      }`}
    >
      {/* FLAGSHIP ribbon for rank 1 */}
      {rank === 1 && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black">
          Champion
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <RankBadge rank={rank} />
            <div>
              <div className="text-lg font-bold text-gray-100">{name}</div>
              <div className="text-xs text-gray-400">
                {challenge?.title ?? row.challenge_id}
              </div>
            </div>
          </div>
          {rank === 1 && (
            <div className="rounded-full bg-amber-500/10 p-1.5 text-amber-300">
              <Trophy className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Hero score */}
        <div className="mt-5 rounded-xl border border-gray-800 bg-gray-950/50 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Total Score
              </div>
              <div className="mt-1 text-4xl font-bold tabular-nums text-white">
                {(row.total * 100).toFixed(0)}
              </div>
            </div>
            <div className="h-10 w-24">
              <Sparkline
                data={scoreSparkline}
                stroke="#818cf8"
                fill="rgba(129,140,248,0.12)"
                width={96}
                height={40}
              />
            </div>
          </div>
        </div>

        {/* ROI */}
        <div className={`mt-3 rounded-xl border p-4 ${roiBgClass}`}>
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                <TrendingUp className="h-3 w-3" />
                ROI
              </div>
              <div className={`mt-1 text-4xl font-bold tabular-nums ${roiColorClass}`}>
                {(row.dimensions.roi * 100).toFixed(0)}%
              </div>
            </div>
            <div className="h-10 w-24">
              <Sparkline
                data={roiSparkline}
                stroke={row.dimensions.roi >= 1 ? "#22c55e" : row.dimensions.roi >= 0.5 ? "#f59e0b" : "#ef4444"}
                fill={
                  row.dimensions.roi >= 1
                    ? "rgba(34,197,94,0.12)"
                    : row.dimensions.roi >= 0.5
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(239,68,68,0.12)"
                }
                width={96}
                height={40}
              />
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
              <Wallet className="h-3 w-3" />
              Left
            </div>
            <div className="mt-1 text-sm font-semibold tabular-nums text-gray-200">
              {formatCents(row.dimensions.money_left_cents)}
            </div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
              <AlertTriangle className="h-3 w-3" />
              Violations
            </div>
            <div
              className={`mt-1 text-sm font-semibold tabular-nums ${
                row.dimensions.policy_violations > 0 ? "text-red-400" : "text-gray-200"
              }`}
            >
              {row.dimensions.policy_violations}
            </div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
              <Clock className="h-3 w-3" />
              Time
            </div>
            <div className="mt-1 text-sm font-semibold tabular-nums text-gray-200">
              {formatDuration(row.dimensions.time_seconds)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function RestRow({ row }: { row: ScoreResult }) {
  const contestant = fixtures.contestants.find((c) => c.id === row.contestant_id);
  const name = contestant?.name ?? row.contestant_id;
  const initials = getInitials(name);
  const roiSparkline = generateSparkline(row.run_id, row.dimensions.roi);
  const scoreSparkline = generateSparkline(`${row.run_id}-score`, row.total, 8);

  return (
    <tr
      key={row.run_id}
      className="group transition hover:bg-gray-800/50"
    >
      <td className="whitespace-nowrap px-4 py-4 text-gray-300 tabular-nums text-sm">
        #{row.rank}
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <Link
          href={`/runs/${row.run_id}`}
          className="flex items-center gap-3 text-gray-100 transition hover:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-gray-300 ring-1 ring-gray-700">
            {initials}
          </span>
          <span className="text-sm font-medium">{name}</span>
        </Link>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-400">
        {fixtures.challenges.find((c) => c.id === row.challenge_id)?.title ?? row.challenge_id}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-gray-100">
        <div className="inline-flex items-center gap-3">
          <span className="text-sm font-semibold">
            {(row.total * 100).toFixed(0)}
          </span>
          <div className="h-6 w-16">
            <Sparkline
              data={scoreSparkline}
              stroke="#818cf8"
              fill="rgba(129,140,248,0.10)"
              width={64}
              height={24}
            />
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">
        <div className={`inline-flex items-center gap-3 ${colorForROI(row.dimensions.roi)}`}>
          <span className="min-w-[3.5rem] text-right text-sm font-semibold">
            {(row.dimensions.roi * 100).toFixed(0)}%
          </span>
          <div className="h-6 w-16">
            <Sparkline
              data={roiSparkline}
              stroke={
                row.dimensions.roi >= 1
                  ? "#22c55e"
                  : row.dimensions.roi >= 0.5
                  ? "#f59e0b"
                  : "#ef4444"
              }
              fill={
                row.dimensions.roi >= 1
                  ? "rgba(34,197,94,0.10)"
                  : row.dimensions.roi >= 0.5
                  ? "rgba(245,158,11,0.10)"
                  : "rgba(239,68,68,0.10)"
              }
              width={64}
              height={24}
            />
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-sm text-gray-300">
        {formatCents(row.dimensions.money_left_cents)}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-sm text-gray-300">
        <span
          className={
            row.dimensions.policy_violations > 0
              ? "text-red-400 font-semibold"
              : ""
          }
        >
          {row.dimensions.policy_violations}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-sm text-gray-300">
        {formatDuration(row.dimensions.time_seconds)}
      </td>
    </tr>
  );
}

function LivePulse() {
  return (
    <span className="ml-3 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
      </span>
      LIVE
    </span>
  );
}

export function LeaderboardCards({ data }: { data: ScoreResult[] }) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => a.rank - b.rank),
    [data]
  );

  const top3 = useMemo(() => sorted.filter((r) => r.rank <= 3), [sorted]);
  const rest = useMemo(() => sorted.filter((r) => r.rank > 3), [sorted]);
  const hasLive = fixtures.runs.some((r) => r.live);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300">
            Leaderboard
          </h2>
          {hasLive && <LivePulse />}
        </div>
        <div className="text-xs text-gray-500">
          {sorted.length} contestant{sorted.length !== 1 ? "s" : ""} ranked
        </div>
      </div>

      {top3.length > 0 && (
        <div className="grid gap-5 md:grid-cols-3">
          {top3.map((row) => (
            <TopCard key={row.run_id} rank={row.rank as 1 | 2 | 3} row={row} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/60 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-4 font-medium">Rank</th>
                  <th className="px-5 py-4 font-medium">Contestant</th>
                  <th className="px-5 py-4 font-medium">Challenge</th>
                  <th className="px-5 py-4 font-medium text-right tabular-nums">
                    Total
                  </th>
                  <th className="px-5 py-4 font-medium text-right tabular-nums">
                    ROI
                  </th>
                  <th className="px-5 py-4 font-medium text-right tabular-nums">
                    Money Left
                  </th>
                  <th className="px-5 py-4 font-medium text-right tabular-nums">
                    Violations
                  </th>
                  <th className="px-5 py-4 font-medium text-right tabular-nums">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {rest.map((row) => (
                  <RestRow key={row.run_id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sorted.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-12 text-center text-sm text-gray-400">
          No scores yet. Run a challenge to populate the leaderboard.
        </div>
      )}
    </div>
  );
}
