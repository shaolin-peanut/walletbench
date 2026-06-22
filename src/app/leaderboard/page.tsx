"use client";

import { useEffect, useState } from "react";
import { LeaderboardCards } from "@/components/LeaderboardCards";
import { fixtures } from "@/lib/fixtures";

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
      <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">Loading leaderboard…</div>
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
