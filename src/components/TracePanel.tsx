"use client";

import { useEffect, useRef, useState } from "react";
import { fixtures } from "@/lib/fixtures";
import type { TraceEvent } from "@/lib/types";
import { Play, Pause, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";

const REPLAY_SPEEDS = [
  { label: "0.5x", value: 1000 },
  { label: "1x", value: 500 },
  { label: "2x", value: 250 },
  { label: "4x", value: 125 },
];

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

const TYPE_COLORS: Record<string, string> = {
  decision: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  tool_call: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  spend: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  artifact: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  policy_violation: "bg-red-500/15 text-red-300 border-red-500/30",
};

export function TracePanel({ events: externalEvents }: { events?: TraceEvent[] } = {}) {
  const [events, setEvents] = useState<TraceEvent[]>(externalEvents ?? []);
  const [replayIndex, setReplayIndex] = useState<number>(-1);
  const [isReplaying, setIsReplaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [selectedRun, setSelectedRun] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibleEvents = selectedRun === "all"
    ? events
    : events.filter((e) => e.run_id === selectedRun);

  useEffect(() => {
    if (externalEvents) {
      setEvents(externalEvents);
      return;
    }
    setEvents(fixtures.traceEvents);
  }, [externalEvents]);

  useEffect(() => {
    if (isReplaying && replayIndex < visibleEvents.length - 1) {
      intervalRef.current = setTimeout(() => {
        setReplayIndex((i) => i + 1);
      }, speed);
    } else if (replayIndex >= visibleEvents.length - 1) {
      setIsReplaying(false);
    }
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isReplaying, replayIndex, visibleEvents.length, speed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replayIndex]);

  const toggleExpand = (seq: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(seq)) next.delete(seq);
      else next.add(seq);
      return next;
    });
  };

  const startReplay = () => {
    setReplayIndex(-1);
    setIsReplaying(true);
  };

  const stopReplay = () => {
    setIsReplaying(false);
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }
  };

  const resetReplay = () => {
    setIsReplaying(false);
    setReplayIndex(-1);
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }
  };

  const displayEvents = replayIndex >= 0 ? visibleEvents.slice(0, replayIndex + 1) : visibleEvents;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-800 p-3 md:flex-row md:items-center md:justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Per-agent trace
        </span>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-gray-300">Run</label>
          <select
            value={selectedRun}
            onChange={(e) => {
              setSelectedRun(e.target.value);
              resetReplay();
            }}
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All runs</option>
            {fixtures.runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.id}
              </option>
            ))}
          </select>

          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {REPLAY_SPEEDS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {!isReplaying ? (
            <button
              onClick={startReplay}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Play className="h-4 w-4" /> Replay
            </button>
          ) : (
            <button
              onClick={stopReplay}
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-100 hover:bg-gray-600"
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
          )}
          <button
            onClick={resetReplay}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-800"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-2 md:p-4">
        <div className="space-y-2">
          {displayEvents.map((event) => {
            const isExpanded = expanded.has(event.seq);
            const contestant = fixtures.contestants.find(
              (c) => c.id === fixtures.getRun(event.run_id)?.contestant_id
            );
            return (
              <div
                key={`${event.run_id}-${event.seq}`}
                className="rounded-lg border border-gray-800 bg-gray-950 hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col gap-2 p-3 md:flex-row md:items-start md:gap-3">
                  <div className="text-xs font-mono text-gray-500 md:w-8">
                    #{event.seq}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          TYPE_COLORS[event.type] ?? "bg-gray-800 text-gray-300 border-gray-700"
                        }`}
                      >
                        {event.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {contestant?.name ?? event.run_id}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(event.ts)}
                      </span>
                      <span className="text-xs text-gray-600">
                        {relativeTime(event.ts)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200">{event.summary}</p>
                    {event.data?.result !== undefined && (
                      <p className="text-xs text-gray-400">
                        delta: {JSON.stringify(event.data.result)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpand(event.seq)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700"
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
                  <div className="border-t border-gray-800 bg-gray-900 p-3">
                    <pre className="overflow-x-auto text-xs text-gray-400">
                      {JSON.stringify(event.data, null, 2)}
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
  );
}
