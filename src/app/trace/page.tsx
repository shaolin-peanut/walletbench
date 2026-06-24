"use client";

import { LeaderboardCards } from "@/components/LeaderboardCards";
import { TracePanel } from "@/components/TracePanel";

export default function TracePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">Trace Timeline</h1>
          <p className="text-gray-400 mt-1">
            Streaming per-agent log with deterministic replay.
          </p>
        </div>
        <TracePanel />
      </div>
    </main>
  );
}
