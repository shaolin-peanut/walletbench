"use client";

import { useEffect, useState } from "react";
import { LeaderboardCards } from "@/components/LeaderboardCards";
import { fixtures } from "@/lib/fixtures";
import { Spinner } from "@/components/Spinner";

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-100 p-4 md:p-8">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-gray-400">Loading leaderboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Leaderboard</h1>
            <p className="text-gray-400 mt-1">
              Top contestants ranked by total rubric score.
            </p>
          </div>
        </div>
        <LeaderboardCards data={fixtures.scoreResults} />
      </div>
    </main>
  );
}
