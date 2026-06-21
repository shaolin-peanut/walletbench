"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fixtures } from "@/lib/fixtures";
import type { Run, TraceEvent } from "@/lib/types";
import { ChevronDown, ChevronRight, Clock, Wallet, Activity, ReceiptText } from "lucide-react";

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

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
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

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function RunTracePage({ params }: { params: { id: string } }) {
  const run: Run | undefined = fixtures.getRun(params.id);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [now, setNow] = useState(Date.now());
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!run) return;
    const initial = fixtures.getTraceEvents(params.id);
    setEvents(initial);

    const interval = setInterval(() => {
      setNow(Date.now());
      if (run.live && run.status === "running") {
        const latest = fixtures.getTraceEvents(params.id);
        setEvents(latest);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [params.id, run?.live, run?.status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  if (!run) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Run not found
        </div>
      </div>
    );
  }

  const contestant = fixtures.contestants.find((c) => c.id === run.contestant_id);
  const challenge = fixtures.challenges.find((c) => c.id === run.challenge_id);

  const stats = {
    decisions: events.filter((e) => e.type === "decision").length,
    tool_calls: events.filter((e) => e.type === "tool_call").length,
    spends: events.filter((e) => e.type === "spend").length,
    artifacts: events.filter((e) => e.type === "artifact").length,
  };

  const toggleExpand = (seq: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(seq)) next.delete(seq);
      else next.add(seq);
      return next;
    });
  };

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
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 font-medium ${
                STATUS_COLORS[run.status]
              }`}
            >
              <Activity className="mr-1.5 h-3.5 w-3.5" />
              {run.status}
            </span>
            <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1">
              <Wallet className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
              {formatCents(run.wallet.balance_cents, run.wallet.currency)}
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

      {/* Stats bar */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-500">Decisions</div>
          <div className="text-lg font-semibold text-blue-700">{stats.decisions}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-500">Tool Calls</div>
          <div className="text-lg font-semibold text-green-700">{stats.tool_calls}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-500">Spends</div>
          <div className="text-lg font-semibold text-amber-700">{stats.spends}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-sm">
          <div className="text-xs font-medium text-gray-500">Artifacts</div>
          <div className="text-lg font-semibold text-purple-700">{stats.artifacts}</div>
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
            {events.map((event) => {
              const isExpanded = expanded.has(event.seq);
              const dataStr = JSON.stringify(event.data, null, 2);
              return (
                <div
                  key={`${event.run_id}-${event.seq}`}
                  className="group rounded-lg border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-colors"
                >
                  <div className="flex flex-col gap-2 p-3 md:flex-row md:items-start md:gap-3">
                    <div className="mt-0.5 text-xs font-mono text-gray-400 md:w-8">
                      #{event.seq}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                            TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-700 border-gray-300"
                          }`}
                        >
                          {event.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {relativeTime(event.ts)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{event.summary}</p>
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
            <div ref={bottomRef} className="h-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
