"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Challenge } from "@/lib/types";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Lock, Shield, AlertTriangle, CheckCircle } from "lucide-react";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 wb-panel">
      <h3 className="text-label font-semibold uppercase tracking-wide text-[var(--wb-muted)]">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DifficultyDot({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  const isEasy = difficulty === "easy";
  const isMedium = difficulty === "medium";
  const isHard = difficulty === "hard";
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const colorVar = isEasy ? "var(--wb-green)" : isMedium ? "var(--wb-amber)" : "var(--wb-red)";
  const bgVar = isEasy ? "var(--wb-bg-green)" : isMedium ? "var(--wb-bg-amber)" : "var(--wb-bg-red)";
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
      style={{
        color: colorVar,
        backgroundColor: bgVar,
        border: `1px solid ${colorVar}35`,
      }}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inset-0 rounded-full opacity-60 blur-[3px]" style={{ backgroundColor: colorVar }} />
        <span className="relative rounded-full" style={{ backgroundColor: colorVar }} />
      </span>
      {label}
    </span>
  );
}

function SpendBar({
  spendCap,
  budget,
  approval,
  currency,
}: {
  spendCap: number;
  budget: number;
  approval?: number;
  currency: string;
}) {
  const pct = Math.min(100, Math.round((spendCap / budget) * 100));
  const approvalPct = approval != null ? Math.min(100, Math.round((approval / budget) * 100)) : null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
        <span className="text-[var(--wb-muted)]">Spend cap</span>
        <div className="relative h-2 flex-1 rounded-full bg-[var(--wb-border)]">
          <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--wb-red)]" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[var(--wb-red)]">{fmtBudget(spendCap, currency)}</span>
      </div>
      {approval != null && (
        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          <span className="text-[var(--wb-muted)]">Approval gate</span>
          <div className="relative h-2 flex-1 rounded-full bg-[var(--wb-border)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--wb-amber)]"
              style={{ width: `${approvalPct!}%` }}
            />
          </div>
          <span className="text-[var(--wb-amber)]">{fmtBudget(approval, currency)}</span>
        </div>
      )}
    </div>
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
        if (!cancelled) setChallenge(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load challenge");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--wb-bg)] p-6 md:p-8">
        <div className="mx-auto max-w-3xl flex items-center justify-center">
          <Spinner className="h-6 w-6 text-[var(--wb-accent)]" />
        </div>
      </main>
    );
  }

  if (error || !challenge) {
    return (
      <main className="min-h-screen bg-[var(--wb-bg)] text-[var(--wb-text)] p-6 md:p-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold font-display text-[var(--wb-text)]">Challenge not found</h1>
          <Link href="/challenges" className="mt-4 inline-block text-[var(--wb-accent)] hover:underline">
            ← Back to challenges
          </Link>
        </div>
      </main>
    );
  }

  const isFlagship = challenge.id === "fund-yourself";

  return (
    <main className="min-h-screen bg-[var(--wb-bg)] text-[var(--wb-text)] p-6 md:p-8">
      <div className="mx-auto max-w-3xl wb-animate-enter">
        <Link href="/challenges" className="text-sm text-[var(--wb-accent)] hover:underline">
          ← Back to challenges
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-title font-display font-bold text-[var(--wb-text)] lg:text-4xl">{challenge.title}</h1>
            <p className="mt-1 text-sm text-[var(--wb-muted)] font-mono">{challenge.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <DifficultyDot difficulty={challenge.difficulty} />
            {isFlagship && (
              <span
                className="rounded-full px-3 py-1 text-xs font-bold text-amber-900"
                style={{ backgroundImage: "linear-gradient(135deg, #f59e0b, #f97316)", fontFamily: "var(--wb-font-display)" }}
              >
                ★ FLAGSHIP
              </span>
            )}
          </div>
        </div>

        <p className="mt-4 text-lg leading-relaxed text-[var(--wb-text)] font-body opacity-90">{challenge.goal}</p>

        <Section title="Budget & Time">
          <SpendBar
            spendCap={challenge.policy.spend_cap_cents}
            budget={challenge.budget_cents}
            approval={challenge.policy.approval_threshold_cents}
            currency={challenge.currency}
          />
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium font-mono tabular-nums">
            <Badge variant="purple">Prize: {fmtBudget(challenge.budget_cents, challenge.currency)}</Badge>
            <Badge variant="default">Time Limit: {fmtTime(challenge.time_limit_seconds)}</Badge>
            {challenge.completion_count != null && (
              <Badge variant="green">{challenge.completion_count} completed</Badge>
            )}
            {challenge.participants != null && (
              <Badge variant="amber">{challenge.participants} entered</Badge>
            )}
            {challenge.best_score != null && (
              <Badge variant="amber">Best score: {(challenge.best_score * 100).toFixed(0)}%</Badge>
            )}
          </div>
        </Section>

        <Section title="Allowed Tools">
          <div className="flex flex-wrap gap-2">
            {challenge.allowed_tools.map((tool) => (
              <Badge key={tool} variant="default">
                {tool}
              </Badge>
            ))}
          </div>
        </Section>

        <Section title="Policy Constraints">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
              <Lock className="h-3 w-3" />
              Spend cap: {fmtBudget(challenge.policy.spend_cap_cents, challenge.currency)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
              <Shield className="h-3 w-3" />
              Approval threshold: {fmtBudget(challenge.policy.approval_threshold_cents, challenge.currency)}
            </span>
            {challenge.policy.forbidden_tools.length > 0 ? (
              challenge.policy.forbidden_tools.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Forbidden: {tool}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-300">
                <CheckCircle className="h-3 w-3" />
                No forbidden tools
              </span>
            )}
          </div>
        </Section>

        <Section title="Success Check">
          <div className="flex flex-wrap items-center gap-3 text-sm font-mono">
            <Badge variant="purple">{challenge.success_check.type}</Badge>
            {Object.keys(challenge.success_check.params).length > 0 && (
              <pre className="overflow-auto rounded-md bg-[rgba(10,10,15,0.6)] p-3 text-xs text-[var(--wb-text)]">
                {JSON.stringify(challenge.success_check.params, null, 2)}
              </pre>
            )}
          </div>
        </Section>

        <Section title="Scoring Weights">
          <div className="space-y-2">
            {Object.entries(challenge.scoring_weights).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3 text-sm font-mono tabular-nums">
                <span className="w-40 text-[var(--wb-muted)]">{key.replace(/_/g, " ")}</span>
                <div className="h-2 flex-1 rounded-full bg-[var(--wb-border)]">
                  <div
                    className="h-2 rounded-full bg-[var(--wb-accent)]"
                    style={{ width: `${Math.round(value * 100)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[var(--wb-text)]">{value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}
