"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Challenge } from "@/lib/types";

function fmtBudget(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${m}m`;
}

function ScoringBar({ weights }: { weights: Challenge["scoring_weights"] }) {
  const entries = Object.entries(weights);
  return (
    <div className="mt-3 space-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-xs">
          <span className="w-24 text-gray-500 truncate">{key.replace(/_/g, " ")}</span>
          <div className="h-2 flex-1 rounded-full bg-gray-800">
            <div
              className="h-2 rounded-full bg-indigo-500"
              style={{ width: `${Math.round(value * 100)}%` }}
            />
          </div>
          <span className="w-8 text-right text-gray-400">{value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/challenges");
        if (res.ok) {
          const data: Challenge[] = await res.json();
          if (!cancelled) {
            setChallenges(data);
          }
        }
      } catch {
        // fail
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">Loading challenges…</div>
      </main>
    );
  }

  const data = challenges;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-100">Challenges</h1>
        <p className="mt-2 text-gray-400">
          Browse all evaluation challenges. Click a card to view the full spec.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((challenge) => {
            const isFlagship = challenge.id === "fund-yourself";
            return (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className={`relative block rounded-xl border bg-gray-900 p-5 shadow-sm transition hover:border-gray-600 hover:shadow-lg ${
                  isFlagship
                    ? "border-amber-500/50 bg-amber-500/5 p-6 lg:p-7"
                    : "border-gray-800"
                }`}
              >
                {isFlagship && (
                  <span className="absolute -top-3 right-4 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                    ★ FLAGSHIP
                  </span>
                )}

                <div className="space-y-3">
                  <div>
                    <h2 className={`font-semibold text-gray-100 ${isFlagship ? "text-2xl" : "text-xl"}`}>
                      {challenge.title}
                    </h2>
                    <p className="text-xs text-gray-500">{challenge.id}</p>
                  </div>

                  <p className="line-clamp-2 text-sm leading-relaxed text-gray-300">{challenge.goal}</p>

                  <div className="flex flex-wrap gap-3 text-sm font-medium text-gray-200">
                    <span className="rounded-md bg-gray-800 px-2.5 py-1">
                      Budget: {fmtBudget(challenge.budget_cents, challenge.currency)}
                    </span>
                    <span className="rounded-md bg-gray-800 px-2.5 py-1">Time: {fmtTime(challenge.time_limit_seconds)}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {challenge.allowed_tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-medium text-indigo-300"
                      >
                        {tool}
                      </span>
                      <span className="rounded-md bg-gray-100 px-2.5 py-1">Time: {fmtTime(challenge.time_limit_seconds)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {challenge.allowed_tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>

                    <ScoringBar weights={challenge.scoring_weights} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
