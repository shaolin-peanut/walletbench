import Link from "next/link";
import { fixtures } from "@/lib/fixtures";

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

const STATUS_STYLES: Record<string, string> = {
  running: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  complete: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  failed: "border-red-500/40 bg-red-500/10 text-red-300",
};

export default function RunsIndexPage() {
  const runs = fixtures.runs;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">Runs</h1>
          <p className="text-gray-400 mt-1">
            All evaluation runs. Click a run to view its trace timeline and
            receipts.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-950/70 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Run</th>
                <th className="px-4 py-3">Challenge</th>
                <th className="px-4 py-3">Contestant</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Wallet</th>
                <th className="px-4 py-3">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {runs.map((run) => {
                const challenge = fixtures.challenges.find(
                  (c) => c.id === run.challenge_id
                );
                const contestant = fixtures.contestants.find(
                  (c) => c.id === run.contestant_id
                );
                return (
                  <tr
                    key={run.id}
                    className="text-gray-300 transition hover:bg-gray-800/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/runs/${run.id}`}
                        className="font-mono font-semibold text-indigo-300 hover:text-indigo-200 hover:underline"
                      >
                        {run.id}
                      </Link>
                      {run.live && (
                        <span className="ml-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                          live
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-200">
                      {challenge?.title ?? run.challenge_id}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {contestant?.name ?? run.contestant_id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
                          STATUS_STYLES[run.status] ??
                          "border-gray-700 bg-gray-800 text-gray-300"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-200">
                      {formatCents(run.wallet.balance_cents, run.wallet.currency)}
                      <span className="block text-[10px] text-gray-500">
                        start {formatCents(run.wallet.start_cents, run.wallet.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(run.started_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {run.ended_at && (
                        <span className="block text-[10px] text-gray-600">
                          {formatTime(
                            Math.round(
                              (new Date(run.ended_at).getTime() -
                                new Date(run.started_at).getTime()) /
                                1000
                            )
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
