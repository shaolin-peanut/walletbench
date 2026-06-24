"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { Run, TraceEvent, Receipt } from "@/lib/types";
import {
  ShieldAlert,
  Activity,
  Wallet,
  Clock,
  ChevronRight,
  ChevronDown,
  FileText,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  GitBranch,
  Terminal,
  Package,
  CircleDollarSign,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";

const EVENT_ICONS: Record<
  string,
  { Icon: typeof GitBranch; color: string; label: string }
> = {
  decision: { Icon: GitBranch, color: "text-indigo-400 border-indigo-500/40", label: "Decision" },
  tool_call: { Icon: Terminal, color: "text-emerald-400 border-emerald-500/40", label: "Tool call" },
  spend: { Icon: CircleDollarSign, color: "text-amber-400 border-amber-500/40", label: "Spend" },
  artifact: { Icon: Package, color: "text-violet-400 border-violet-500/40", label: "Artifact" },
  policy_violation: {
    Icon: ShieldAlert,
    color: "text-red-400 border-red-500/40",
    label: "Policy violation",
  },
};

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m${seconds % 60}s ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h${minutes % 60}m ago`;
}

function elapsedTime(startedAt: string, endedAt: string | null, live: boolean): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diff = Math.max(0, end - start);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function buildBalanceCurve(
  events: TraceEvent[],
  startBalance: number,
  currency: string
): { x: number; y: number; ts: string }[] {
  const start = new Date(events[0]?.ts ?? new Date().toISOString()).getTime();
  const end = new Date(events[events.length - 1]?.ts ?? start).getTime();
  const points: { x: number; y: number; ts: string }[] = [
    { x: 0, y: startBalance, ts: events[0]?.ts ?? new Date().toISOString() },
  ];
  let balance = startBalance;
  for (const ev of events) {
    if (ev.type === "spend" && ev.data.amount_cents) {
      balance -= Math.abs(ev.data.amount_cents);
    } else if (ev.type === "artifact" && ev.data.result && typeof (ev.data.result as any).payout === "number") {
      balance += (ev.data.result as any).payout;
    }
    const t = new Date(ev.ts).getTime();
    points.push({ x: t - start, y: balance, ts: ev.ts });
  }
  return points;
}

function ReceiptDrawer({
  receipts,
  open,
  onClose,
}: {
  receipts: Receipt[];
  open: boolean;
  onClose: () => void;
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setActive(null);
  }, [open]);

  if (!open) return null;
  const selected = active ? receipts.find((r) => r.stripe_ref === active) : null;

  const kindIcon = (kind: Receipt["kind"]) => {
    if (kind === "charge") return <CircleDollarSign className="h-4 w-4" />;
    if (kind === "payout") return <ArrowUpFromLine className="h-4 w-4" />;
    return <RotateCcw className="h-4 w-4" />;
  };

  const kindColor = (kind: Receipt["kind"]) => {
    if (kind === "charge") return "text-amber-400 bg-amber-400/10 border-amber-500/30";
    if (kind === "payout") return "text-emerald-400 bg-emerald-400/10 border-emerald-500/30";
    return "text-red-400 bg-red-400/10 border-red-500/30";
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-white/10 bg-[#141420] shadow-2xl flex flex-col animate-wb-fade-in-slide">
        <header className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-white/80" />
            <h2 className="font-display text-lg font-semibold text-white">Receipts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {receipts.length === 0 && (
            <p className="text-sm text-white/60">No receipts for this run.</p>
          )}
          {receipts.map((r) => (
            <button
              type="button"
              key={r.stripe_ref}
              onClick={() => setActive(r.stripe_ref)}
              className={`w-full rounded-2xl border p-4 text-left transition hover:border-white/20 ${
                active === r.stripe_ref ? "border-white/30" : "border-white/10"
              } bg-white/[0.03]`}
            >
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${kindColor(r.kind)}`}>
                  {kindIcon(r.kind)}
                  <span className="uppercase tracking-wider">{r.kind}</span>
                </div>
                <span className="font-data text-xs text-white/60">{new Date(r.ts).toLocaleTimeString()}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm text-white/80">{r.purpose}</span>
                <span className="font-data font-semibold text-white">
                  {r.kind !== "payout" ? "-" : "+"}
                  {formatCents(r.amount_cents, r.currency)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-white/50">
                <span>Balance after</span>
                <span>{formatCents(r.balance_after_cents, r.currency)}</span>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="border-t border-white/10 bg-white/[0.02] p-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Stripe Ref</span>
                <span className="font-data text-xs text-white/80">{selected.stripe_ref}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-white/60">Type</span>
                  <div className="mt-1 font-medium text-white">{selected.kind.toUpperCase()}</div>
                </div>
                <div>
                  <span className="text-white/60">Time</span>
                  <div className="mt-1 font-medium text-white">{new Date(selected.ts).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-white/60">Amount</span>
                  <div className="mt-1 font-medium text-white">{formatCents(selected.amount_cents, selected.currency)}</div>
                </div>
                <div>
                  <span className="text-white/60">Balance after</span>
                  <div className="mt-1 font-medium text-white">{formatCents(selected.balance_after_cents, selected.currency)}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-white/60">Purpose</span>
                  <div className="mt-1 font-medium text-white">{selected.purpose}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function RunTracePage({ params }: { params: { id: string } }) {
  const [run, setRun] = useState<Run | undefined>();
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const cancelledRef = useRef(false);
  const [challengeTitle, setChallengeTitle] = useState<string | null>(null);
  const [policyViolationBannerKey, setPolicyViolationBannerKey] = useState(0);
  const [animatingChart, setAnimatingChart] = useState(false);

  useEffect(() => {
    let cancelled = false;
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    setAnimatingChart(false);

    (async () => {
      try {
        const [runRes, traceRes, receiptsRes] = await Promise.all([
          fetch(`/api/runs/${encodeURIComponent(params.id)}`),
          fetch(`/api/runs/${encodeURIComponent(params.id)}/trace`),
          fetch(`/api/receipts?run_id=${encodeURIComponent(params.id)}`),
        ]);
        const runJson = runRes.ok ? await runRes.json() : null;
        if (!runRes.ok || !runJson) throw new Error("Run not found");
        const traceJson = traceRes.ok ? await traceRes.json() : [];
        const receiptsJson = receiptsRes.ok ? await receiptsRes.json() : [];

        if (!cancelled) {
          setRun(runJson as Run);
          setEvents(traceJson as TraceEvent[]);
          setReceipts(receiptsJson as Receipt[]);
          setPolicyViolationBannerKey((k) => k + 1);
        }

        if (!cancelled) {
          try {
            const cRes = await fetch(`/api/challenges/${encodeURIComponent(runJson.challenge_id)}`);
            if (cRes.ok) {
              const cJson = (await cRes.json()) as { title?: string };
              setChallengeTitle(cJson.title ?? null);
            }
          } catch {
            // ignore
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load run");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (events.length === 0) return;
    setAnimatingChart(true);
    const t = setTimeout(() => setAnimatingChart(false), 1200);
    return () => clearTimeout(t);
  }, [events.length]);

  useEffect(() => {
    if (!run) return;
    const interval = setInterval(() => {
      setNow(Date.now());
      if (run.live && run.status === "running") {
        fetch(`/api/runs/${encodeURIComponent(params.id)}/trace`)
          .then((res) => (res.ok ? res.json() : []))
          .then((data: TraceEvent[]) => {
            if (!cancelledRef.current) setEvents(data);
          })
          .catch(() => {});
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [params.id, run]);

  const policyViolations = useMemo(
    () => events.filter((e) => e.type === "policy_violation"),
    [events]
  );

  const balanceCurve = useMemo(
    () => (run ? buildBalanceCurve(events, run.wallet.start_cents, run.wallet.currency) : []),
    [run, events]
  );

  const lastReceipt = receipts[receipts.length - 1];

  if (loading) {
    return (
      <main className="min-h-screen bg-white/[0.02] p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mt-8 flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white/70">
            Loading replay…
          </div>
        </div>
      </main>
    );
  }

  if (error || !run) {
    return (
      <main className="min-h-screen bg-white/[0.02] p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">
            {error ?? "Run not found"}
          </div>
        </div>
      </main>
    );
  }

  const toggleExpand = (seq: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(seq)) next.delete(seq);
      else next.add(seq);
      return next;
    });
  };

  const isLive = run.live && run.status === "running";

  return (
    <>
      <main className="min-h-screen bg-white/[0.02] p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          {policyViolations.length > 0 && (
            <div
              key={policyViolationBannerKey}
              className="mb-4 w-full overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-red-200 shadow-[0_0_24px_rgba(220,38,38,0.25)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    {policyViolations.length} Policy violation{policyViolations.length === 1 ? "" : "s"} detected
                  </span>
                </div>
                <span className="text-xs text-red-300/80">Review timeline for details</span>
              </div>
            </div>
          )}

          {/* Header + Ticker */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-4 md:p-6">
            <div
              className={`pointer-events-none absolute -inset-x-0 top-0 h-1 ${
                isLive ? "bg-emerald-500" : "bg-white/10"
              }`}
            />
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                    {challengeTitle ?? run.challenge_id}
                  </h1>
                  {isLive && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/60">{run.contestant_id}</p>
                <p className="text-xs text-white/50">
                  Started {relativeTime(run.started_at)}
                  {run.ended_at ? ` · Finished ${relativeTime(run.ended_at)}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-xl border px-3 py-2 text-xs font-semibold ${
                    run.status === "running"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : run.status === "complete"
                        ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                        : "border-red-500/40 bg-red-500/10 text-red-300"
                  }`}
                >
                  <Activity className="mr-2 h-3.5 w-3.5" />
                  {run.status.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setReceiptsOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/80 hover:border-white/20"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  <span className="font-data text-sm text-white">{elapsedTime(run.started_at, run.ended_at, run.live)}</span>
                </button>
              </div>
            </div>

            {/* Ticker + time */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Wallet</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-data text-3xl font-bold tracking-tighter text-white">
                    {formatCents(run.wallet.balance_cents, run.wallet.currency)}
                  </span>
                  <span className="text-xs text-white/40">/ {formatCents(run.wallet.start_cents, run.wallet.currency)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, (run.wallet.balance_cents / run.wallet.start_cents) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Receipts</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-data text-3xl font-bold tracking-tighter text-white">{receipts.length}</span>
                  <span className="text-xs text-white/40">transactions</span>
                </div>
                <div className="mt-2 text-xs text-white/60">
                  Latest: {lastReceipt ? `${lastReceipt.kind} · ${formatCents(lastReceipt.amount_cents, lastReceipt.currency)}` : "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Violations</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`font-data text-3xl font-bold tracking-tighter ${policyViolations.length ? "text-red-400" : "text-white"}`}
                  >
                    {policyViolations.length}
                  </span>
                </div>
                <div className="mt-2 text-xs text-white/60">
                  {policyViolations.length ? "Exceeds policy — review required" : "No violations"}
                </div>
              </div>
            </div>
          </section>

          {/* Burn chart */}
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-white">Burn chart</h2>
                <p className="text-xs text-white/60">Running balance across the run</p>
              </div>
              <span className="font-data text-xs text-white/50">
                {events.length} events
              </span>
            </div>

            <div className="mt-4 relative h-56 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <svg
                className="h-full w-full"
                viewBox={`0 0 1000 220`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="burnGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.6" />
                  </filter>
                </defs>

                {balanceCurve.length > 1 && (() => {
                  const w = 1000;
                  const h = 220;
                  const maxY = run.wallet.start_cents;
                  const minY = Math.min(...balanceCurve.map((p) => p.y));
                  const range = maxY - minY || 1;
                  const xStep = w / Math.max(balanceCurve.length - 1, 1);
                  const toX = (i: number) => i * xStep;
                  const toY = (v: number) => h - ((v - minY) / range) * (h - 40) - 10;
                  const line = balanceCurve.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(p.y).toFixed(2)}`).join(" ");
                  const fill = line + ` L ${toX(balanceCurve.length - 1)} ${h} L 0 ${h} Z`;
                  const drawClass = animatingChart ? "chart-draw" : "";
                  return (
                    <g>
                      <path d={fill} fill="url(#burnGradient)" />
                      <path d={line} fill="none" stroke="#818cf8" strokeWidth="2.5" className={drawClass} filter="url(#glow)" />
                      {balanceCurve.map((p, i) => (
                        <circle key={i} cx={toX(i)} cy={toY(p.y)} r="2.5" fill="#0a0a0f" stroke="#818cf8" strokeWidth="2" />
                      ))}
                    </g>
                  );
                })()}

                {balanceCurve.length === 1 && (
                  <circle cx={500} cy={110} r="4" fill="#818cf8" />
                )}
              </svg>
            </div>
          </section>

          {/* Timeline */}
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-white">Timeline</h2>
                <p className="text-xs text-white/60">Ordered trace — scroll to replay</p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptsOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/80 hover:border-white/20"
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
                Receipts
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {events.map((event) => {
                const meta = EVENT_ICONS[event.type] ?? EVENT_ICONS.decision;
                const Icon = meta.Icon;
                const isExpanded = expanded.has(event.seq);
                return (
                  <div
                    key={`${event.run_id}-${event.seq}`}
                    className="group rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-white/20"
                  >
                    <div className="flex flex-col gap-3 p-3 md:flex-row md:items-start md:gap-4">
                      <div className="flex items-center gap-3 md:w-48 md:flex-col md:items-start">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${meta.color} bg-white/[0.03]`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-data text-xs text-white/70">#{event.seq}</div>
                          <div className="text-xs text-white/50">{relativeTime(event.ts)}</div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                          {meta.label}
                        </span>
                        <p className="text-sm text-white/90">{event.summary}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(event.seq)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                      >
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        {isExpanded ? "Hide data" : "Data"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/10 bg-black/30 p-3">
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words font-data text-xs text-white/80">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <ReceiptDrawer receipts={receipts} open={receiptsOpen} onClose={() => setReceiptsOpen(false)} />
    </>
  );
}
