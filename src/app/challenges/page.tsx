"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Challenge } from "@/lib/types";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/ui/Badge";

function fmtBudget(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m > 0 ? `${m}m ` : ""}${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function DifficultyDot({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  const variant = difficulty === "easy" ? "green" : difficulty === "medium" ? "amber" : "red";
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return (
    <Badge variant={variant} className="gap-1.5">
      <span className={`h-2 w-2 rounded-full bg-current`} />
      {label}
    </Badge>
  );
}

function ScoringBar({ weights }: { weights: Challenge["scoring_weights"] }) {
  const entries = Object.entries(weights);
  return (
    <div className="mt-3 space-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-xs">
          <span className="w-24 text-[var(--wb-muted)] truncate font-body">{key.replace(/_/g, " ")}</span>
          <div className="h-2 flex-1 rounded-full bg-[var(--wb-border)]">
            <div
              className="h-2 rounded-full bg-[var(--wb-accent)]"
              style={{ width: `${Math.round(value * 100)}%` }}
            />
          </div>
          <span className="w-8 text-right text-[var(--wb-muted)] tabular-nums font-mono">{value.toFixed(2)}</span>
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
          if (!cancelled) setChallenges(data);
        }
      } catch {
        // fail silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--wb-bg)] text-[var(--wb-text)] p-6 md:p-8">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-[var(--wb-muted)]">Loading challenges…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--wb-bg)] text-[var(--wb-text)] p-6 md:p-8">
      <div className="mx-auto max-w-6xl wb-animate-enter">
        <h1 className="text-display font-display font-bold tracking-tight text-[var(--wb-text)]">Challenges</h1>
        <p className="mt-2 text-[var(--wb-muted)] font-body">
          Browse all evaluation challenges. Click a card to view the full spec.
        </p>

        {challenges.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--wb-muted)]">No challenges available right now.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge) => {
              const isFlagship = challenge.id === "fund-yourself";
              return (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className={`group relative block transition hover:scale-[1.01] ${
                    isFlagship ? "md:col-span-2 lg:col-span-1" : ""
                  }`}
                >
                  <div
                    className={`relative wb-card overflow-hidden ${
                      isFlagship
                        ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-[var(--wb-surface)] to-[var(--wb-surface)]"
                        : ""
                    }`}
                  >
                    {isFlagship && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-80" />
                    )}

                    {isFlagship && (
                      <div
                        className="absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-bold text-amber-900 shadow-lg"
                        style={{
                          backgroundImage: "linear-gradient(135deg, #f59e0b, #f97316)",
                          fontFamily: "var(--wb-font-display)",
                        }}
                      >
                        ★ FLAGSHIP
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h2
                          className={`font-semibold text-[var(--wb-text)] ${
                            isFlagship ? "text-heading font-display" : "text-xl font-display"
                          }`}
                        >
                          {challenge.title}
                        </h2>
                        <p className="text-xs text-[var(--wb-muted)] font-mono">{challenge.id}</p>
                      </div>
                      <DifficultyDot difficulty={challenge.difficulty} />
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--wb-text)] font-body opacity-80">
                      {challenge.goal}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium font-mono tabular-nums">
                      {challenge.prize_pool_cents != null && (
                        <span className="rounded-md bg-[var(--wb-border)] px-2.5 py-1 text-[var(--wb-green)]">
                          Prize: {fmtBudget(challenge.prize_pool_cents, challenge.currency)}
                        </span>
                      )}
                      {challenge.completion_count != null && (
                        <span className="rounded-md bg-[var(--wb-border)] px-2.5 py-1 text-[var(--wb-text)]">
                          {challenge.completion_count} completed
                        </span>
                      )}
                      {challenge.participants != null && (
                        <span className="rounded-md bg-[var(--wb-border)] px-2.5 py-1 text-[var(--wb-text)]">
                          {challenge.participants} entered
                        </span>
                      )}
                      {challenge.participants == null && challenge.completion_count == null && (
                        <span className="rounded-md bg-[var(--wb-border)] px-2.5 py-1 text-[var(--wb-text)]">
                          {fmtTime(challenge.time_limit_seconds)}
                        </span>
                      )}
                    </div>

                    {challenge.best_score != null && (
                      <div className="mt-3 text-sm font-mono tabular-nums">
                        <span className="text-[var(--wb-muted)]">Best score: </span>
                        <span className="font-semibold text-[var(--wb-amber)]">
                          {(challenge.best_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {challenge.allowed_tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-full bg-[var(--wb-bg-accent)] px-2.5 py-0.5 text-xs font-medium text-[var(--wb-accent-glow)]"
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
