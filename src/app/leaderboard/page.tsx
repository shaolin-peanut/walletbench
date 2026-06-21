"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Challenge,
  ScoreResult,
} from "@/lib/types";
import { fixtures } from "@/lib/fixtures";

type SortKey =
  | "rank"
  | "name"
  | "roi"
  | "money_left"
  | "policy_violations"
  | "total";

type SortDir = "asc" | "desc";

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function Badge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-black text-xs font-bold">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 text-black text-xs font-bold">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-bold">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-700 text-gray-300 text-xs font-bold">
      {rank}
    </span>
  );
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) {
    return <span className="text-gray-600 ml-1">↕</span>;
  }
  return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

export default function LeaderboardPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [rows, setRows] = useState<ScoreResult[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [loading, setLoading] = useState(true);

  // Load challenges
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const res = await fetch("/api/challenges");
        if (res.ok) {
          const data: Challenge[] = await res.json();
          if (!cancelled) {
            setChallenges(data);
            if (data.length > 0) {
              setSelectedChallengeId(data[0].id);
            }
          }
          return;
        }
      } catch {
        // fallback
      }
      if (!cancelled) {
        setChallenges(fixtures.challenges);
        if (fixtures.challenges.length > 0) {
          setSelectedChallengeId(fixtures.challenges[0].id);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load leaderboard for selected challenge
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (!selectedChallengeId) {
      setRows([]);
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(`/api/leaderboard?challenge_id=${encodeURIComponent(selectedChallengeId)}`);
        if (res.ok) {
          const data: ScoreResult[] = await res.json();
          if (!cancelled) {
            setRows(data);
          }
          return;
        }
      } catch {
        // fallback
      }
      if (!cancelled) {
        setRows(fixtures.leaderboard(selectedChallengeId));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedChallengeId]);

  const selectedChallenge = useMemo(
    () => challenges.find((c) => c.id === selectedChallengeId) ?? null,
    [challenges, selectedChallengeId]
  );

  const enrichedRows = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      contestantName: fixtures.contestants.find((c) => c.id === r.contestant_id)?.name ?? r.contestant_id,
    }));
  }, [rows]);

  const sortedRows = useMemo(() => {
    const data = [...enrichedRows];
    data.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortKey) {
        case "rank":
          aVal = a.rank;
          bVal = b.rank;
          break;
        case "name":
          aVal = a.contestantName.toLowerCase();
          bVal = b.contestantName.toLowerCase();
          break;
        case "roi":
          aVal = a.dimensions.roi;
          bVal = b.dimensions.roi;
          break;
        case "money_left":
          aVal = a.dimensions.money_left_cents;
          bVal = b.dimensions.money_left_cents;
          break;
        case "policy_violations":
          aVal = a.dimensions.policy_violations;
          bVal = b.dimensions.policy_violations;
          break;
        case "total":
          aVal = a.total;
          bVal = b.total;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const numA = aVal as number;
      const numB = bVal as number;
      return sortDir === "asc" ? numA - numB : numB - numA;
    });
    return data;
  }, [enrichedRows, sortKey, sortDir]);

  function handleSort(column: SortKey) {
    if (sortKey === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setSortDir("asc");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">Loading leaderboard…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-400 mb-6">
          Contestant performance across challenges, ranked by total score.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="challenge-select">
            Challenge
          </label>
          <select
            id="challenge-select"
            value={selectedChallengeId}
            onChange={(e) => setSelectedChallengeId(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-100 rounded-md px-3 py-2 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {selectedChallenge && (
          <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="text-xl font-semibold">{selectedChallenge.title}</h2>
            <p className="text-gray-400 mt-1">{selectedChallenge.goal}</p>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
              <tr>
                <th
                  className="px-4 py-3 cursor-pointer select-none"
                  onClick={() => handleSort("rank")}
                >
                  <span className="flex items-center">
                    Rank
                    <SortIcon column="rank" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <span className="flex items-center">
                    Contestant
                    <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none text-right"
                  onClick={() => handleSort("roi")}
                >
                  <span className="flex items-center justify-end">
                    ROI
                    <SortIcon column="roi" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none text-right"
                  onClick={() => handleSort("money_left")}
                >
                  <span className="flex items-center justify-end">
                    Money Left
                    <SortIcon column="money_left" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none text-right"
                  onClick={() => handleSort("policy_violations")}
                >
                  <span className="flex items-center justify-end">
                    Violations
                    <SortIcon column="policy_violations" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none text-right"
                  onClick={() => handleSort("total")}
                >
                  <span className="flex items-center justify-end">
                    Total Score
                    <SortIcon column="total" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950">
              {sortedRows.map((row) => (
                <tr key={row.run_id} className="hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3">
                    <Badge rank={row.rank} />
                  </td>
                  <td className="px-4 py-3 font-medium">{row.contestantName}</td>
                  <td className="px-4 py-3 text-right">{formatPercent(row.dimensions.roi)}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(row.dimensions.money_left_cents)}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        row.dimensions.policy_violations > 0
                          ? "text-red-400 font-semibold"
                          : "text-gray-300"
                      }
                    >
                      {row.dimensions.policy_violations}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{row.total.toFixed(2)}</td>
                </tr>
              ))}
              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No leaderboard data for this challenge.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
