"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fixtures } from "@/lib/fixtures";
import type { Run, TraceEvent, Receipt } from "@/lib/types";
import { startReplay } from "@/lib/replay";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Wallet,
  Activity,
  ReceiptText,
  Play,
  Pause,
  Repeat2,
} from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  decision: "bg-blue-100 text-blue-700 border-blue-300",
  tool_call: "bg-green-100 text-green-700 border-green-300",
  spend: "bg-amber-100 text-amber-700 border-amber-300",
  artifact: "bg-purple-100 text-purple-700 border-purple-300",
  policy_violation: "bg-red-100 text-red-700 border-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  running: "bg-green-100 text-green-700 border-green-500 animate-pulse",
  complete: "bg-blue-100 text-blue-700 border-blue-500",
  failed: "bg-red-100 text-red-700 border-red-500",
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

function classNames(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

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
    ? fixtures.getReceipts(run.id).sort(
        (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
      )
    : [];

  const stats = {
    decisions: events.filter((e) => e.type === "decision").length,
    tool_calls: events.filter((e) => e.type === "tool_call").length,
    spends: events.filter((e) => e.type === "spend").length,
    artifacts: events.filter((e) => e.type === "artifact").length,
  };

  // Live mode: poll fixtures each second
  useEffect(() => {
    if (mode !== "live" || !run) return;

    const interval = setInterval(() => {
      setNow(Date.now());
      if (run.live && run.status === "running") {
        const latest = fixtures.getTraceEvents(run.id);
        setEvents(latest);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, run?.id, run?.live, run?.status]);

  // Scroll on new trace/receipt events
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length, receipts.length]);

  // Setup live display when switching to live or changing run
  useEffect(() => {
    if (mode !== "live" || !run) return;
    setEvents(traceEvents);
    setBalance(run.wallet.balance_cents);
    lastBalanceRef.current = run.wallet.balance_cents;
    setReplayDone(false);
    setPlaying(false);
  }, [mode, run?.id]);

  // Replay Lifecycle
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
        onRunUpdate: (r) => {
          setBalance(r.wallet.balance_cents);
          lastBalanceRef.current = r.wallet.balance_cents;
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

  const handleSpeedChange = (next: number) => {
    setSpeed(next);
    controllerRef.current?.setSpeed(next);
  };

  // Auto-start replay when mode flips to replay and not already started
  useEffect(() => {
    if (mode === "replay") {
      startReplayForRun();
    }
    return () => {
      controllerRef.current?.stop();
      controllerRef.current = null;
    };
  }, [mode === "replay"]); // intentionally only effect when mode is replay; we guard runtime below

  // Guard: if replay mode but no active controller and not done, allow re-run
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

  if (!run) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Run not found
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

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-gray-900">
              {challenge?.title ?? "Unknown Challenge"}
            </h1>
            <div className="text-sm text-gray-600">
              {contestant?.name ?? "Unknown Contestant"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* Mode toggle */}
            <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => {
                  if (mode === "live") return;
                  controllerRef.current?.stop();
                  setMode("live");
                  setEvents([]);
                  setReceipts([]);
                  setReplayDone(false);
                  setPlaying(false);
                  setBalance(run.wallet.balance_cents);
                  lastBalanceRef.current = run.wallet.balance_cents;
                }}
                className={classNames(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition",
                  mode === "live"
                    ? "bg-gray-900 text-white shadow"
                    : "text-gray-600 hover:text-gray-800"
                )}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>▶ Live</span>
              </button>
              <button
                type="button"
                onClick={switchToReplay}
                className={classNames(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition",
                  mode === "replay"
                    ? "bg-gray-900 text-white shadow"
                    : "text-gray-600 hover:text-gray-800"
                )}
              >
                <Repeat2 className="h-3.5 w-3.5" />
                <span>⟳ Replay</span>
              </button>
            </div>

            {/* Status */}
            <span
              className={classNames(
                "inline-flex items-center rounded-full border px-3 py-1 font-medium",
                mode === "live"
                  ? STATUS_COLORS[run.status]
                  : replayDone
                  ? "bg-indigo-100 text-indigo-700 border-indigo-400"
                  : playing
                  ? STATUS_COLORS["running"]
                  : "bg-gray-100 text-gray-700 border-gray-400"
              )}
            >
              {mode === "live"
                ? run.status
                : replayDone
                ? "replay complete"
                : playing
                ? "replaying"
                : "replay paused"}
            </span>

            {/* Replay controls */}
            {mode === "replay" && run && (
              <>
                <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white">
                  {playing ? (
                    <button
                      type="button"
                      onClick={pauseReplay}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-l-full text-gray-700 transition hover:bg-gray-50"
                      title="Pause replay"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeReplay}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-l-full text-gray-700 transition hover:bg-gray-50"
                      title="Play replay"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <select
                    value={speed}
                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                    className="h-8 border-0 bg-transparent px-2 pr-6 text-xs font-medium text-gray-700 outline-none"
                  >
                    {SPEEDS.map((s) => (
                      <option key={s} value={s}>
                        {s}x
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Wallet with optional animation */}
            <span
              className={classNames(
                "inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 transition",
                balanceTick && "balance-tick"
              )}
            >
              <Wallet className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
              {formatCents(displayBalance, run.wallet.currency)}
            </span>

            <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1">
              <Clock className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
              {elapsedTime(run.started_at, run.ended_at, run.live)}
            </span>

            <Link
              href={`/runs/${run.id}/receipts`}
              className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              <ReceiptText className="mr-1.5 h-3.5 w-3.5" />
              View Receipts
            </Link>
          </div>
        </div>
      </div>

      {/* Replay complete badge */}
      {mode === "replay" && replayDone && (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
          Replay complete
        </div>
      )}

      {/* Stats bar */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-500">Decisions</div>
          <div className="text-lg font-semibold text-blue-700">
            {stats.decisions}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-500">Tool Calls</div>
          <div className="text-lg font-semibold text-green-700">
            {stats.tool_calls}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-500">Spends</div>
          <div className="text-lg font-semibold text-amber-700">
            {stats.spends}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-500">Artifacts</div>
          <div className="text-lg font-semibold text-purple-700">
            {stats.artifacts}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Trace Timeline
          </h2>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-2 md:p-4">
          <div className="space-y-2">
            {events.map((event, idx) => {
              const isNew = idx === events.length - 1 && mode === "replay";
              const isExpanded = expanded.has(event.seq);
              const dataStr = JSON.stringify(event.data, null, 2);
              return (
                <div
                  key={`${event.run_id}-${event.seq}`}
                  className={classNames(
                    "group rounded-lg border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-colors",
                    isNew && "event-fade-in"
                  )}
                >
                  <div className="flex flex-col gap-2 p-3 md:flex-row md:items-start md:gap-3">
                    <div className="mt-0.5 text-xs font-mono text-gray-400 md:w-8">
                      #{event.seq}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={classNames(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            TYPE_COLORS[event.type] ??
                              "bg-gray-100 text-gray-700 border-gray-300"
                          )}
                        >
                          {event.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {relativeTime(event.ts)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">
                        {event.summary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExpand(event.seq)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
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
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-3">
                      <pre className="overflow-x-auto text-xs text-gray-700">
                        {dataStr}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
            {receipts.map((receipt, idx) => {
              const isNew =
                idx === receipts.length - 1 && mode === "replay";
              const delta =
                receipt.kind === "charge"
                  ? -receipt.amount_cents
                  : receipt.amount_cents;
              return (
                <div
                  key={`${receipt.ts}-${receipt.stripe_ref}`}
                  className={classNames(
                    "group rounded-lg border border-emerald-100 bg-emerald-50/40 transition-colors",
                    isNew && "event-fade-in"
                  )}
                >
                  <div className="flex flex-col gap-2 p-3 md:flex-row md:items-start md:gap-3">
                    <div className="mt-0.5 text-xs font-mono text-gray-400 md:w-8">
                      R#
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={classNames(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            receipt.kind === "charge"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : receipt.kind === "payout"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-sky-200 bg-sky-50 text-sky-700"
                          )}
                        >
                          {receipt.kind}
                        </span>
                        <span className="text-xs text-gray-500">
                          {relativeTime(receipt.ts)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">
                        {receipt.purpose}
                      </p>
                      <div className="text-xs text-gray-600">
                        Balance after:{" "}
                        {formatCents(
                          receipt.balance_after_cents,
                          receipt.currency
                        )}
                      </div>
                    </div>
                    <div
                      className={classNames(
                        "text-right text-sm font-semibold",
                        delta < 0 ? "text-red-600" : "text-emerald-600"
                      )}
                    >
                      {delta >= 0 ? "+" : "−"}
                      {formatCents(Math.abs(delta), receipt.currency)}
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
  );
}
