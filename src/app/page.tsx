"use client";

import { useEffect, useState, useMemo } from "react";
import { Contestant, Run } from "@/lib/types";

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function relativeTime(ts: string): string {
  const seconds = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function Home() {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, rRes] = await Promise.all([
          fetch("/api/contestants"),
          fetch("/api/runs"),
        ]);
        const cData = cRes.ok ? await cRes.json() : [];
        const rData = rRes.ok ? await rRes.json() : [];
        if (!cancelled) {
          setContestants(cData);
          setRuns(rData);
        }
      } catch {
        // keep empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const latestRunsByContestant = useMemo(() => {
    const map = new Map<string, Run>();
    for (const run of runs) {
      const existing = map.get(run.contestant_id);
      if (!existing || new Date(run.started_at) > new Date(existing.started_at)) {
        map.set(run.contestant_id, run);
      }
    }
    return map;
  }, [runs]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-white/60">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <section className="relative overflow-hidden border-b border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            WalletBench
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/60">
            Economic evaluation layer for autonomous agents
          </p>
          <p className="mt-2 text-sm text-white/40">
            Live contestant wallet balances from the current run pack
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {contestants.map((contestant) => {
            const run = latestRunsByContestant.get(contestant.id);
            return (
              <div
                key={contestant.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="font-display text-lg font-semibold text-white">
                      {contestant.name}
                    </h2>
                    <p className="text-xs text-white/50 font-mono">
                      {run?.id ?? "no-run"}
                    </p>
                    <p className="text-xs text-white/40">
                      Started {run ? relativeTime(run.started_at) : "—"}
                    </p>
                  </div>
                  {run && run.live && run.status === "running" ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-xs font-semibold">LIVE</span>
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-white/50 uppercase">
                      {run?.status ?? "idle"}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-data text-2xl font-bold tracking-tighter text-white">
                    {run ? formatMoney(run.wallet.balance_cents, run.wallet.currency) : "—"}
                  </span>
                  {run && (
                    <span className="text-xs text-white/40">
                      / {formatMoney(run.wallet.start_cents, run.wallet.currency)}
                    </span>
                  )}
                </div>

                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  {run && (
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            (run.wallet.balance_cents / run.wallet.start_cents) * 100
                          )
                        )}%`,
                      }}
                    />
                  )}
                </div>

                <div className="mt-3">
                  <a
                    href={`/runs/${encodeURIComponent(run?.id ?? "")}`}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    View run →
                  </a>
                </div>
              </div>
            );
          })}

          {contestants.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/50">
              No contestants found
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
