"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fixtures } from "@/lib/fixtures";
import type { Run, TraceEvent, Receipt } from "@/lib/types";
import { startReplay } from "@/lib/replay";
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Clock,
  Wallet,
  Activity,
  ReceiptText,
  Play,
  Pause,
  Repeat2,
  Wrench,
  TrendingDown,
  Package,
  AlertTriangle,
  X,
  FileText,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
} from "lucide-react";
import { Spinner } from "@/components/Spinner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";

// ---------- Aesthetic tokens ----------
const SURFACE = "#0b1220";
const CHROME = "#111827";
const RED_BANNER = "#7f1d1d"; // red-900
const RED_BORDER = "#b91c1c"; // red-700
const GOLD = "#f59e0b"; // amber-500
const EMERALD = "#34d399"; // emerald-400

const TYPE_ICONS: Record<string, React.ReactNode> = {
  decision: <Brain className="h-3.5 w-3.5" />,
  tool_call: <Wrench className="h-3.5 w-3.5" />,
  spend: <TrendingDown className="h-3.5 w-3.5" />,
  artifact: <Package className="h-3.5 w-3.5" />,
  policy_violation: <AlertTriangle className="h-3.5 w-3.5" />,
};

const SPEEDS = [1, 2, 5, 10];

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function elapsedTime(
  startedAt: string,
  endedAt: string | null,
  live: boolean
): string {
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

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------- Drawer ----------
function ReceiptDrawer({
  open,
  onClose,
  receipts,
  run,
}: {
  open: boolean;
  onClose: () => void;
  receipts: Receipt[];
  run: Run;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-gray-800 bg-gray-950 shadow-2xl transition-transform">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>Receipts</span>
            <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-mono text-gray-400">
              {receipts.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 transition hover:bg-gray-800 hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-56px)] space-y-3 overflow-y-auto p-4">
          {receipts.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500">
              No transactions yet.
            </div>
          )}
          {receipts.map((r) => {
            const delta =
              r.kind === "charge" ? -r.amount_cents : r.amount_cents;
            return (
              <div
                key={`${r.ts}-${r.stripe_ref}`}
                className="rounded-xl border border-gray-800 bg-gray-900 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                          r.kind === "charge"
                            ? "border-red-200/80 bg-red-950 text-red-300"
                            : r.kind === "payout"
                            ? "border-emerald-200/80 bg-emerald-950 text-emerald-300"
                            : "border-sky-200/80 bg-sky-950 text-sky-300"
                        )}
                      >
                        {r.kind === "charge" && (
                          <ArrowDownToLine className="h-3 w-3" />
                        )}
                        {r.kind === "payout" && (
                          <ArrowUpFromLine className="h-3 w-3" />
                        )}
                        {r.kind === "refund" && (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        {r.kind}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(r.ts).toLocaleTimeString([], {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-200">{r.purpose}</div>
                    <div className="text-xs font-mono text-gray-500">
                      {r.stripe_ref}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-right text-sm font-semibold",
                      delta < 0 ? "text-red-400" : "text-emerald-400"
                    )}
                  >
                    {delta >= 0 ? "+" : "−"}
                    {formatCents(Math.abs(delta), r.currency)}
                  </div>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gray-700 to-gray-600"
                    style={{
                      width: `${Math.min(
                        100,
                        (r.balance_after_cents / run.wallet.start_cents) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>Balance after</span>
                  <span className="font-semibold text-gray-300">
                    {formatCents(r.balance_after_cents, r.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

// ---------- Main page ----------
export default function RunTracePage({ params }: { params: { id: string } }) {
  const run: Run | undefined = fixtures.getRun(params.id);
  const [mode, setMode] = useState<"live" | "replay">("live");
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [replayDone, setReplayDone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [now, setNow] = useState(Date.now());
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const controllerRef = useRef<ReturnType<typeof startReplay> | null>(null);
  const lastBalanceRef = useRef<number | null>(null);
  const [balanceTick, setBalanceTick] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const challenge = run
    ? fixtures.challenges.find((c) => c.id === run.challenge_id)
    : undefined;
  const contestant = run
    ? fixtures.contestants.find((c) => c.id === run.contestant_id)
    : undefined;

  const traceEvents = run
    ? fixtures.getTraceEvents(run.id).sort((a, b) => a.seq - b.seq)
    : [];
  const allReceipts = run
    ? fixtures
        .getReceipts(run.id)
        .sort(
          (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
        )
    : [];

  const hasViolations = events.some((e) => e.type === "policy_violation");

  function formatTime(ts: string): string {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // burn data includes historical receipts + start point
  const burnData = useMemo(() => {
    if (!run) return [];
    const base = [
      {
        label: "Start",
        ts: run.started_at,
        balance: run.wallet.start_cents,
        delta: 0,
      },
    ];
    const mapped = allReceipts.map((receipt) => {
      const delta =
        receipt.kind === "charge"
          ? -receipt.amount_cents
          : receipt.amount_cents;
      return {
        label: formatTime(receipt.ts),
        ts: receipt.ts,
        balance: receipt.balance_after_cents,
        delta,
        purpose: receipt.purpose,
      };
    });
    return [...base, ...mapped];
  }, [run, allReceipts]);

  // Clerk stats (for the replay bar)
  const stats = {
    decisions: events.filter((e) => e.type === "decision").length,
    tool_calls: events.filter((e) => e.type === "tool_call").length,
    spends: events.filter((e) => e.type === "spend").length,
    artifacts: events.filter((e) => e.type === "artifact").length,
    violations: events.filter((e) => e.type === "policy_violation").length,
  };

  // ---------- Live polling ----------
  useEffect(() => {
    if (mode !== "live" || !run) return;
    const interval = setInterval(() => {
      setNow(Date.now());
      if (run.live && run.status === "running") {
        const latest = fixtures.getTraceEvents(run.id);
        setEvents(latest);
        const latestReceipts = fixtures
          .getReceipts(run.id)
          .sort(
            (a, b) =>
              new Date(a.ts).getTime() - new Date(b.ts).getTime()
          );
        setReceipts(latestReceipts);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, run?.id, run?.live, run?.status]);

  // ---------- Scroll to latest ----------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length, receipts.length]);

  // ---------- Live init ----------
  useEffect(() => {
    if (mode !== "live" || !run) return;
    setEvents(traceEvents);
    setBalance(run.wallet.balance_cents);
    lastBalanceRef.current = run.wallet.balance_cents;
    setReplayDone(false);
    setPlaying(false);
  }, [mode, run?.id]);

  // ---------- Replay controller ----------
  const startReplayForRun = () => {
    if (!run) return;
    controllerRef.current?.stop();
    setReplayDone(false);
    setPlaying(true);
    setEvents([]);
    setReceipts([]);
    setBalance(run.wallet.start_cents);
    lastBalanceRef.current = run.wallet.start_cents;

    const ctrl = startReplay(
      run.id,
      traceEvents,
      allReceipts,
      {
        onTrace: (event) => {
          setEvents((curr) => [...curr, event]);
        },
        onReceipt: (receipt) => {
          setReceipts((curr) => [...curr, receipt]);
          const next = receipt.balance_after_cents;
          setBalance(next);
          if (lastBalanceRef.current !== null) {
            setBalanceTick(true);
            setTimeout(() => setBalanceTick(false), 450);
          }
          lastBalanceRef.current = next;
        },
        onDone: () => {
          setPlaying(false);
          setReplayDone(true);
        },
      },
      {
        speed,
        paused: false,
      }
    );
    controllerRef.current = ctrl;
  };

  const pauseReplay = () => {
    controllerRef.current?.pause();
    setPlaying(false);
  };

  const resumeReplay = () => {
    controllerRef.current?.resume();
    setPlaying(true);
  };

  const switchToReplay = () => {
    controllerRef.current?.stop();
    setMode("replay");
    setEvents([]);
    setReceipts([]);
    setReplayDone(false);
    setPlaying(false);
  };

  const switchToLive = () => {
    controllerRef.current?.stop();
    setMode("live");
    setEvents([]);
    setReceipts([]);
    setReplayDone(false);
    setPlaying(false);
    setBalance(run ? run.wallet.balance_cents : null);
    lastBalanceRef.current = run ? run.wallet.balance_cents : null;
  };

  const handleSpeedChange = (next: number) => {
    setSpeed(next);
    controllerRef.current?.setSpeed(next);
  };

  useEffect(() => {
    if (mode === "replay") {
      startReplayForRun();
    }
    return () => {
      controllerRef.current?.stop();
      controllerRef.current = null;
    };
  }, [mode]);

  // Re-run replay if fully cleared and not done
  useEffect(() => {
    if (
      mode === "replay" &&
      !controllerRef.current &&
      !replayDone &&
      run &&
      playing === false &&
      events.length === 0 &&
      receipts.length === 0
    ) {
      startReplayForRun();
    }
  }, [mode, replayDone, run?.id, playing, events.length, receipts.length]);

  // Cleanup
  useEffect(() => {
    return () => {
      controllerRef.current?.stop();
    };
  }, []);

  // ---------- Loading guard ----------
  if (!run) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-400">
          <Spinner className="mx-auto mb-2 h-8 w-8 text-amber-400" />
          Loading run…
        </div>
      </div>
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

  const displayBalance =
    balance !== null ? balance : run.wallet.balance_cents;

  // For the draw animation on mount, we add a class via a state flag
  const [chartVisible, setChartVisible] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setChartVisible(true), 60);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen bg-[#030712] text-gray-100">
      {/* ---------- Full-width policy banner ---------- */}
      {hasViolations && (
        <div className="w-full border-b border-red-900 bg-red-950 px-4 py-3 text-center text-sm font-bold uppercase tracking-wider text-red-200 md:text-base">
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Policy violation detected — review trace timeline for details
          </span>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-3 pb-12 pt-6 md:px-6">
        {/* ---------- Cinematic top block ---------- */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 shadow-2xl backdrop-blur">
          {/* Hero row: title + contestant */}
          <div className="border-b border-gray-800 px-4 py-4 md:px-6 md:py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                 arena run
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {challenge?.title ?? "Unknown Challenge"}
                </h1>
                <p className="text-sm text-gray-500">
                  {contestant?.name ?? run.contestant_id}
                </p>
              </div>

              {/* Wallet ticker — the scoreboard */}
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "rounded-xl border border-gray-800 bg-gray-950 px-5 py-3 shadow-lg transition",
                    balanceTick && "balance-tick"
                  )}
                >
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Wallet className="h-3.5 w-3.5 text-amber-400" />
                    <span className="uppercase tracking-wider">Wallet</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tighter text-emerald-300 md:text-5xl">
                      {formatCents(displayBalance, run.wallet.currency)}
                    </span>
                    <span className="text-xs text-gray-500">
                      / {formatCents(run.wallet.start_cents, run.wallet.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-800 px-4 py-3 md:px-6">
            <div
              className="inline-flex rounded-full border border-gray-800 bg-gray-950/80 p-1"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                onClick={switchToLive}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  mode === "live"
                    ? "bg-gray-800 text-white shadow"
                    : "text-gray-500 hover:text-gray-200"
                )}
              >
                <Activity className="h-3.5 w-3.5" />
                Live
              </button>
              <button
                type="button"
                role="tab"
                onClick={switchToReplay}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  mode === "replay"
                    ? "bg-gray-800 text-white shadow"
                    : "text-gray-500 hover:text-gray-200"
                )}
              >
                <Repeat2 className="h-3.5 w-3.5" />
                Replay
              </button>
            </div>

            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                mode === "live"
                  ? run.status === "running"
                    ? "border-emerald-500/80 bg-emerald-950 text-emerald-300"
                    : run.status === "complete"
                    ? "border-indigo-500/80 bg-indigo-950 text-indigo-300"
                    : "border-red-500/80 bg-red-950 text-red-300"
                  : replayDone
                  ? "border-indigo-500/80 bg-indigo-950 text-indigo-300"
                  : playing
                  ? "border-emerald-500/80 bg-emerald-950 text-emerald-300"
                  : "border-gray-700 bg-gray-900 text-gray-400"
              )}
            >
              <span
                className={cn(
                  "mr-1.5 h-1.5 w-1.5 rounded-full",
                  mode === "live" && run.status === "running" && "animate-pulse bg-emerald-400",
                  mode === "replay" && playing && "animate-pulse bg-emerald-400"
                )}
              />
              {mode === "live"
                ? run.status
                : replayDone
                ? "replay complete"
                : playing
                ? "replaying"
                : "replay paused"}
            </span>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-mono">
                {elapsedTime(run.started_at, run.ended_at, run.live)}
              </span>
            </div>

            {mode === "replay" && (
              <div className="ml-auto inline-flex items-center gap-1 rounded-full border border-gray-800 bg-gray-900">
                {playing ? (
                  <button
                    type="button"
                    onClick={pauseReplay}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-l-full text-gray-300 transition hover:bg-gray-950/60"
                    title="Pause replay"
                  >
                    <Pause className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumeReplay}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-l-full text-gray-300 transition hover:bg-gray-950/60"
                    title="Play replay"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                )}
                <select
                  value={speed}
                  onChange={(e) =>
                    handleSpeedChange(Number(e.target.value))
                  }
                  className="h-8 border-0 bg-transparent px-2 pr-6 text-xs font-semibold text-gray-300 outline-none"
                >
                  {SPEEDS.map((s) => (
                    <option key={s} value={s}>
                      {s}x
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Receipts drawer trigger */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:border-emerald-700 hover:bg-emerald-900"
            >
              <ReceiptText className="h-3.5 w-3.5" />
              Receipts
              <span className="rounded-full bg-emerald-900 px-1.5 py-0.5 font-mono text-emerald-400">
                {allReceipts.length}
              </span>
            </button>
          </div>
        </div>

        {/* ---------- Stats bar (sports replay style) ---------- */}
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
          <StatPill label="Decisions" value={stats.decisions} accent="text-sky-300" />
          <StatPill label="Tool calls" value={stats.tool_calls} accent="text-emerald-300" />
          <StatPill label="Spends" value={stats.spends} accent="text-amber-300" />
          <StatPill label="Artifacts" value={stats.artifacts} accent="text-violet-300" />
          <StatPill
            label="Violations"
            value={stats.violations}
            accent={stats.violations > 0 ? "text-red-400" : "text-gray-300"}
          />
        </div>

        {/* ---------- Burn chart ---------- */}
        <div className="mt-4 rounded-2xl border border-gray-800 bg-gray-900/80 p-4 shadow-xl md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Wallet burn
            </h2>
            <span className="text-xs font-medium text-gray-500">
              {mode === "replay" ? "Live replay" : "Final run balance"}
            </span>
          </div>
          <div className="h-56 w-full md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burnData} margin={{ left: 4, right: 12, top: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="walletBalanceRunGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={chartVisible ? 0.55 : 0} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={chartVisible ? 0.04 : 0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  stroke="#4b5563"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                />
                <YAxis
                  stroke="#4b5563"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(value) => `$${Number(value / 100).toFixed(0)}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as {
                      label: string;
                      ts: string;
                      balance: number;
                      delta: number;
                      purpose?: string;
                    };
                    return (
                      <div className="rounded-xl border border-gray-800 bg-gray-900 p-3 shadow-2xl">
                        <div className="text-xs text-gray-500">{item.label}</div>
                        <div className="mt-1 text-lg font-bold text-white">
                          {formatCents(item.balance, run.wallet.currency)}
                        </div>
                        {item.delta !== 0 && (
                          <div
                            className={cn(
                              "text-xs font-mono",
                              item.delta < 0 ? "text-red-400" : "text-emerald-400"
                            )}
                          >
                            {item.delta >= 0 ? "+" : "−"}
                            {formatCents(Math.abs(item.delta), run.wallet.currency)}
                            {item.purpose ? ` · ${item.purpose}` : ""}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={run.wallet.start_cents}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke={EMERALD}
                  strokeWidth={3}
                  fill="url(#walletBalanceRunGrad)"
                  className={chartVisible ? "" : "opacity-0"}
                  style={{
                    transition: "opacity 800ms ease-out, stroke-width 200ms ease",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---------- Timeline ---------- */}
        <div className="mt-4 rounded-2xl border border-gray-800 bg-gray-900/80 shadow-xl">
          <div className="border-b border-gray-800 px-4 py-3 md:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Trace Timeline
              </h2>
              <span className="text-xs text-gray-600">
                {events.length} events
              </span>
            </div>
          </div>

          <div className="max-h-[75vh] overflow-y-auto p-2 md:p-4">
            <div className="space-y-2">
              {events.map((event, idx) => {
                const isNew = idx === events.length - 1 && mode === "replay";
                const isExpanded = expanded.has(event.seq);
                const dataStr = JSON.stringify(event.data, null, 2);
                return (
                  <div
                    key={`${event.run_id}-${event.seq}`}
                    className={cn(
                      "group rounded-xl border border-gray-800 bg-gray-900/60 transition",
                      isNew && "event-fade-in"
                    )}
                  >
                    <div className="flex flex-col gap-2 p-3 md:flex-row md:items-start md:gap-3">
                      <div className="flex items-center gap-2 md:w-10">
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                            event.type === "decision" &&
                              "border-sky-500/60 bg-sky-950 text-sky-300",
                            event.type === "tool_call" &&
                              "border-emerald-500/60 bg-emerald-950 text-emerald-300",
                            event.type === "spend" &&
                              "border-amber-500/60 bg-amber-950 text-amber-300",
                            event.type === "artifact" &&
                              "border-violet-500/60 bg-violet-950 text-violet-300",
                            event.type === "policy_violation" &&
                              "border-red-500/80 bg-red-950 text-red-300"
                          )}
                        >
                          {TYPE_ICONS[event.type]}
                        </span>
                        <div className="text-xs font-mono text-gray-500 md:hidden">
                          #{event.seq}
                        </div>
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wider text-gray-600">
                            {event.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-gray-600">·</span>
                          <span className="text-xs text-gray-500">
                            {relativeTime(event.ts)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-200">
                          {event.summary}
                        </p>

                        {event.type === "spend" && event.data.amount_cents && (
                          <div className="text-sm font-semibold text-amber-300">
                            −{formatCents(event.data.amount_cents, run.wallet.currency)}
                          </div>
                        )}
                        {event.type === "policy_violation" && (
                          <div className="text-xs text-red-400">
                            {event.data.reason ?? "Policy breach detected."}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 md:self-center">
                        <div className="hidden text-xs font-mono text-gray-600 md:block">
                          #{event.seq}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(event.seq)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-800 bg-gray-950/60 px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-800 hover:text-gray-300"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" /> Hide
                            </>
                          ) : (
                            <>
                              <ChevronRight className="h-3.5 w-3.5" /> Data
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-800 bg-gray-950/60 p-3">
                        <pre className="overflow-x-auto text-xs text-gray-400">
                          {dataStr}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Receipts inline for replay feel */}
              {receipts.map((receipt, idx) => {
                const isNew =
                  idx === receipts.length - 1 && mode === "replay";
                const delta =
                  receipt.kind === "charge"
                    ? -receipt.amount_cents
                    : receipt.amount_cents;
                const kindLabel =
                  receipt.kind === "charge"
                    ? "payment"
                    : receipt.kind === "payout"
                    ? "payout"
                    : "refund";
                return (
                  <div
                    key={`${receipt.ts}-${receipt.stripe_ref}`}
                    className={cn(
                      "group rounded-xl border border-gray-800 bg-gray-900/40 transition",
                      isNew && "event-fade-in"
                    )}
                  >
                    <div className="flex flex-col gap-2 p-3 md:flex-row md:items-start md:gap-3">
                      <div className="flex items-center gap-2 md:w-10">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-700 bg-gray-950 text-gray-400">
                          <ReceiptText className="h-3.5 w-3.5" />
                        </span>
                        <div className="text-xs font-mono text-gray-600 md:hidden">
                          R#
                        </div>
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wider text-gray-600">
                            {kindLabel}
                          </span>
                          <span className="text-xs text-gray-600">·</span>
                          <span className="text-xs text-gray-500">
                            {relativeTime(receipt.ts)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-200">
                          {receipt.purpose}
                        </p>
                        <div className="text-xs font-mono text-gray-600">
                          {receipt.stripe_ref}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:self-center">
                        <div className="hidden text-xs font-mono text-gray-600 md:block">
                          R#
                        </div>
                        <div
                          className={cn(
                            "text-sm font-semibold",
                            delta < 0 ? "text-red-400" : "text-emerald-400"
                          )}
                        >
                          {delta >= 0 ? "+" : "−"}
                          {formatCents(Math.abs(delta), receipt.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} className="h-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Receipt drawer instance */}
      <ReceiptDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        receipts={allReceipts}
        run={run}
      />
    </main>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-3 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className={cn("text-2xl font-bold tracking-tight", accent)}>
        {value}
      </div>
    </div>
  );
}
