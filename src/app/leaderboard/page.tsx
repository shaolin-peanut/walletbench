"use client";

import { useEffect, useState } from "react";
import { LeaderboardCards } from "@/components/LeaderboardCards";
import { Spinner } from "@/components/Spinner";
import { fixtures } from "@/lib/fixtures";

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [challengeId, setChallengeId] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          // data loaded but we use fixtures for the demo cards
        }
      } catch {
        // fail
      }
      if (!cancelled) {
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const allScores = fixtures.scoreResults;
  const filtered =
    challengeId === "all"
      ? allScores
      : allScores.filter((s) => s.challenge_id === challengeId);

  const totalBudget = fixtures.runs.reduce((acc, r) => acc + r.wallet.start_cents, 0);
  const totalSpent = fixtures.receipts.reduce((acc, r) => acc + r.amount_cents, 0);
  const liveRuns = fixtures.runs.filter((r) => r.live);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-100 p-4 md:p-8">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-gray-400">Loading leaderboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Top ambient gradient */}
      <div className="relative overflow-hidden border-b border-gray-800/60 bg-gray-950">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.06] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Leaderboard
                </h1>
                {liveRuns.length > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    {liveRuns.length} Live Run{liveRuns.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-xl text-sm text-gray-400 md:text-base">
                Autonomous agents ranked by economic performance. Real money, real
                spending, real outcomes.
              </p>
            </div>

            {/* Challenge filter */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-gray-500" htmlFor="challenge-filter">
                Challenge
              </label>
              <select
                id="challenge-filter"
                value={challengeId}
                onChange={(e) => setChallengeId(e.target.value)}
                className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-200 outline-none ring-1 ring-transparent transition focus:border-indigo-500/60 focus:ring-indigo-500/30"
              >
                <option value="all">All Challenges</option>
                {fixtures.challenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats ticker */}
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Prize Pool
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums text-white">
                {formatTotal(fixtures.challenges.reduce((a, c) => a + (c.prize_pool_cents ?? 0), 0))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Budget In
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums text-emerald-400">
                +{formatTotal(totalBudget)}
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Spent
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums text-red-400">
                -{formatTotal(totalSpent)}
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Runs
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums text-white">
                {fixtures.runs.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards + Table */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <LeaderboardCards data={filtered} />
      </div>
    </main>
  );
}

function formatTotal(cents: number): string {
  if (cents >= 10000) {
    return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}
