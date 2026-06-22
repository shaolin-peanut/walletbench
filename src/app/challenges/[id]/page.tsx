"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Challenge } from "@/lib/types";

function fmtBudget(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function fmtTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${m}m`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-200">{children}</span>
  );
}

export default function ChallengeDetailPage({ params }: { params: { id: string } }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/challenges/${encodeURIComponent(params.id)}`);
        if (!res.ok) {
          throw new Error("Challenge not found");
        }
        const data: Challenge = await res.json();
        if (!cancelled) {
          setChallenge(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load challenge");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto max-w-3xl">Loading challenge…</div>
      </main>
    );
  }

  if (error || !challenge) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-100">Challenge not found</h1>
          <Link href="/challenges" className="mt-4 inline-block text-indigo-400 hover:underline">
            ← Back to challenges
          </Link>
        </div>
      </main>
    );
  }

  const isFlagship = challenge.id === "fund-yourself";

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/challenges" className="text-sm text-indigo-400 hover:underline">
          ← Back to challenges
        </Link>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 lg:text-4xl">{challenge.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{challenge.id}</p>
          </div>
          {isFlagship && (
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
              ★ FLAGSHIP
            </span>
          )}
        </div>

        <p className="mt-4 text-lg leading-relaxed text-gray-300">{challenge.goal}</p>

        <Section title="Budget & Time">
          <div className="flex flex-wrap gap-3 text-sm font-medium text-gray-200">
            <Pill>Budget: {fmtBudget(challenge.budget_cents, challenge.currency)}</Pill>
            <Pill>Time Limit: {fmtTime(challenge.time_limit_seconds)}</Pill>
          </div>
        </Section>

        <Section title="Allowed Tools">
          <div className="flex flex-wrap gap-2">
            {challenge.allowed_tools.map((tool) => (
              <Pill key={tool}>{tool}</Pill>
            ))}
          </div>
        </Section>

        <Section title="Policy">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between rounded border border-gray-800 bg-gray-950/60 px-3 py-2">
              <span className="text-gray-400">Spend Cap</span>
              <span className="font-medium text-gray-100">{fmtBudget(challenge.policy.spend_cap_cents, challenge.currency)}</span>
            </div>
            <div className="flex justify-between rounded border border-gray-800 bg-gray-950/60 px-3 py-2">
              <span className="text-gray-400">Approval Threshold</span>
              <span className="font-medium text-gray-100">{fmtBudget(challenge.policy.approval_threshold_cents, challenge.currency)}</span>
            </div>
            <div className="flex justify-between rounded border border-gray-800 bg-gray-950/60 px-3 py-2">
              <span className="text-gray-400">Forbidden Tools</span>
              <span className="font-medium text-gray-100">
                {challenge.policy.forbidden_tools.length ? challenge.policy.forbidden_tools.join(", ") : "None"}
              </span>
            </div>
          </div>
        </Section>

        <Section title="Success Check">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-md bg-indigo-500/15 px-2.5 py-1 font-medium text-indigo-300">{challenge.success_check.type}</span>
            {Object.keys(challenge.success_check.params).length > 0 && (
              <pre className="overflow-auto rounded-md bg-gray-950/60 p-3 text-xs text-gray-300">
                {JSON.stringify(challenge.success_check.params, null, 2)}
              </pre>
            )}
          </div>
        </Section>

        <Section title="Scoring Weights">
          <div className="space-y-2">
            {Object.entries(challenge.scoring_weights).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3 text-sm">
                <span className="w-40 text-gray-400">{key.replace(/_/g, " ")}</span>
                <div className="h-2 flex-1 rounded-full bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${Math.round(value * 100)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-gray-100">{value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
