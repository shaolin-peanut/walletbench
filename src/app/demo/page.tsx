"use client";

import { LeaderboardCards } from "@/components/LeaderboardCards";
import { TracePanel } from "@/components/TracePanel";
import { ReceiptsGallery } from "@/components/ReceiptsGallery";
import { fixtures } from "@/lib/fixtures";
import type { TraceEvent } from "@/lib/types";

export default function DemoPage() {
  return (
    <div className="restage-demo min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="mb-8 border-b border-white pb-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            WalletBench Demo
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Restaged for screencap — high contrast, no debug chrome.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
          <LeaderboardCards data={fixtures.scoreResults} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Trace Timeline</h2>
          <TracePanel events={fixtures.traceEvents as TraceEvent[]} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Receipts</h2>
          <ReceiptsGallery />
        </section>
      </div>
    </div>
  );
}
